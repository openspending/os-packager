;(function(angular) {

  angular.module('Application')
    .factory('PackageService', [
      '$q', '$timeout', '_', 'Services', 'UtilsService', 'Configuration',
      'ApplicationState', 'ApplicationLoader', 'LoginService',
      'ValidationService',
      function($q, $timeout, _, Services, UtilsService, Configuration,
        ApplicationState, ApplicationLoader, LoginService,
        ValidationService) {
        var attributes = {};
        var resources = [];
        var schema = null;

        ApplicationLoader.then(function() {
          if (_.isObject(ApplicationState.package)) {
            attributes = ApplicationState.package.attributes;
            resources = ApplicationState.package.resources;
          }
          ApplicationState.package = {
            attributes: attributes,
            resources: resources
          };
        });

        var fiscalDataPackage = Services.fiscalDataPackage;
        var utils = Services.utils;

        var createNewDataPackage = function() {
          attributes.regionCode = '';
          attributes.countryCode = '';
          attributes.cityCode = '';
          resources.splice(0, resources.length);
        };
        createNewDataPackage();

        var result = {
          loadSchema: function() {
            return $q(function(resolve) {
              schema = fiscalDataPackage.getFiscalDataPackageSchema();
              resolve();
            });
          },
          getAttributes: function() {
            return attributes;
          },
          getResources: function() {
            return resources;
          },
          recreatePackage: function() {
            createNewDataPackage();
          },
          createResource: function(fileOrUrl, state) {
            return $q(function(resolve, reject) {
              var fileDescriptor = null;
              utils.blobToFileDescriptor(fileOrUrl,
                Configuration.maxFileSizeToStore)
                .then(function(fileOrUrl) {
                  var status = ValidationService.validateResource(fileOrUrl);
                  state.status = status;
                  return $q(function(resolve, reject) {
                    status.$promise.then(function(results) {
                      fileOrUrl.encoding = results.encoding;
                      resolve(utils.fileDescriptorToBlob(fileOrUrl));
                    }).catch(reject);
                  });
                })
                .then(function(fileOrUrl) {
                  var url = fileOrUrl;
                  if (_.isString(url)) {
                    url = UtilsService.decorateProxyUrl(url);
                  }
                  fileDescriptor = fileOrUrl;
                  return fiscalDataPackage.createResourceFromSource(url);
                })
                .then(function(resource) {
                  // Save file object - it will be needed when publishing
                  // data package
                  if (_.isObject(fileDescriptor)) {
                    resource.blob = fileDescriptor;
                  }
                  if (_.isString(fileOrUrl)) {
                    resource.source.url = fileOrUrl;
                  }
                  return resource;
                })
                .then(resolve)
                .catch(reject);
            });
          },
          addResource: function(resource) {
            utils.addItemWithUniqueName(resources, resource);
          },
          removeAllResources: function() {
            resources.splice(0, resources.length);
          },
          validateFiscalDataPackage: function() {
            var validationResult = {
              state: 'checking'
            };
            var dataPackage = this.createFiscalDataPackage();
            validationResult.$promise = $q(function(resolve, reject) {
              return fiscalDataPackage.validateDataPackage(dataPackage, schema)
                  .then(resolve)
                  .catch(reject);
            });

            validationResult.$promise
                .then(function(results) {
                  validationResult.state = 'completed';
                  if (results && !results.valid) {
                    validationResult.errors = results.errors;
                  }
                  return results;
                })
                .catch(function(error) {
                  validationResult.state = null;
                  Configuration.defaultErrorHandler(error);
                });

            return validationResult;
          },
          createFiscalDataPackage: function() {
            return fiscalDataPackage.createFiscalDataPackage(attributes,
              resources);
          },
          publish: function() {
            var files = _.map(resources, function(resource) {
              var url = resource.source.url;
              if (_.isString(url) && (url.length > 0)) {
                url = 'proxy?url=' + encodeURIComponent(url);
              }
              return {
                name: resource.name + '.csv',
                data: resource.data.raw,
                url: url,
                file: resource.blob
              };
            });
            var modifiedResources = _.map(resources, function(resource) {
              if (resource.source.url) {
                resource = _.clone(resource);
                resource.source = {
                  fileName: resource.name + '.csv'
                };
              }
              return resource;
            });
            var dataPackage = fiscalDataPackage.createFiscalDataPackage(
              attributes, modifiedResources);
            dataPackage.owner = LoginService.userId;
            dataPackage.author = LoginService.name +
              ' <' + LoginService.email + '>';

            // Create and prepend datapackage.json
            var packageFile = {
              name: Configuration.defaultPackageFileName,
              data: dataPackage
            };
            files.splice(0, 0, packageFile);

            var triggerDigest = function(immediateCall) {
              if (_.isFunction(triggerDigest)) {
                $timeout(triggerDigest, 500);
              }
              if (!!immediateCall) {
                $timeout(function() {});
              }
            };

            files = _.map(files, function(file) {
              file.$promise = $q(function(resolve, reject) {
                triggerDigest(true);
                Services.datastore.readContents(file)
                  .then(function() {
                    return Services.datastore.prepareForUpload(file, {
                      // jscs:disable
                      permission_token: LoginService.permissionToken,
                      // jscs:enable
                      name: dataPackage.name,
                      owner: dataPackage.owner
                    });
                  })
                  .then(function() {
                    return Services.datastore.upload(file);
                  })
                  .then(function() {
                    // datapackage.json has one more step in processing chain
                    if (file.name != Configuration.defaultPackageFileName) {
                      file.status = Services.datastore.ProcessingStatus.READY;
                    }
                    return file;
                  })
                  .then(resolve)
                  .catch(function(error) {
                    file.status = Services.datastore.ProcessingStatus.FAILED;
                    file.error = error;
                    reject(error);
                  });
              });
              return file;
            });

            files.$promise = $q(function(resolve, reject) {
              $q.all(_.pluck(files, '$promise'))
                .then(function(results) {
                  packageFile.countOfLines = 0;
                  _.each(files, function(file) {
                    if (file !== packageFile) {
                      packageFile.countOfLines += file.countOfLines;
                    }
                  });
                  Services.datastore.publish(packageFile)
                    .then(function() {
                      triggerDigest = null;
                      packageFile.status =
                        Services.datastore.ProcessingStatus.READY;
                      resolve(packageFile);
                    })
                    .catch(function(error) {
                      triggerDigest = null;
                      packageFile.status =
                        Services.datastore.ProcessingStatus.FAILED;
                      packageFile.error = error;
                      reject(error);
                    });
                })
                .catch(reject);
            });

            return files;
          }
        };

        result.loadSchema();

        return result;
      }
    ]);

})(angular);
