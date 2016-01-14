;(function(angular) {

  angular.module('Application')
    .factory('PackageService', [
      '$q', '$timeout', '_', 'Services', 'UtilsService', 'Configuration',
      function($q, $timeout, _, Services, UtilsService, Configuration) {
        var attributes = {};
        var resources = [];
        var schema = null;

        var fiscalDataPackage = Services.fiscalDataPackage;
        var utils = Services.utils;
        fiscalDataPackage.getFiscalDataPackageSchema().then(function(result) {
          schema = result;
        });

        var createNewDataPackage = function() {
          attributes.regionCode = '';
          attributes.countryCode = '';
          attributes.cityCode = '';
          resources.splice(0, resources.length);
        };
        createNewDataPackage();

        return {
          getAttributes: function() {
            return attributes;
          },
          getResources: function() {
            return resources;
          },
          recreatePackage: function() {
            createNewDataPackage();
          },
          createResource: function(fileOrUrl) {
            return $q(function(resolve, reject) {
              fiscalDataPackage.createResourceFromSource(fileOrUrl)
                .then(function(resource) {
                  // Save file object - it will be needed when publishing
                  // data package
                  if (_.isObject(fileOrUrl)) {
                    resource.blob = fileOrUrl;
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
            var dataPackage = this.createFiscalDataPackage();
            return $q(function(resolve, reject) {
              return fiscalDataPackage.validateDataPackage(dataPackage, schema)
                .then(resolve)
                .catch(reject);
            });
          },
          createFiscalDataPackage: function() {
            return fiscalDataPackage.createFiscalDataPackage(attributes,
              resources);
          },
          publish: function() {
            var files = _.map(resources, function(resource) {
              return {
                name: resource.name + '.csv',
                data: resource.data.raw,
                url: '/proxy?url=' + encodeURIComponent(resource.source.url),
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
                      name: dataPackage.name
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
      }
    ]);

})(angular);
