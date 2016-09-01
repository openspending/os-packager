'use strict';

var _ = require('lodash');

var fiscalDataPackage = require('../../../services/package');
var utils = require('../../../services/utils');
var osDataStore = require('../../../services/os-datastore');

angular.module('Application')
  .factory('PackageService', [
    '$q', '$timeout', 'UtilsService', 'Configuration', 'LoginService',
    'ValidationService',
    function($q, $timeout, UtilsService, Configuration, LoginService,
      ValidationService) {
      var isExternalDataPackage = false;
      var attributes = {};
      var resources = [];
      var schema = null;

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
        isExternalDataPackage: function() {
          return isExternalDataPackage;
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
        loadExternalDataPackage: function(url) {
          return $q(function(resolve, reject) {
            fiscalDataPackage.loadFiscalDataPackage(url)
              .then(function(data) {
                console.log(data);
                attributes = data.attributes;
                attributes.regionCode = '';
                attributes.countryCode = '';
                attributes.cityCode = '';
                resources = data.resources;
                isExternalDataPackage = true;
                resolve();
              })
              .catch(reject);
          });
        },
        createResource: function(fileOrUrl, state) {
          var fileDescriptor = null;
          return $q(function(resolve, reject) {
            utils.blobToFileDescriptor(fileOrUrl)
              .then(resolve)
              .catch(reject);
          })
            .then(function(fileOrUrl) {
              var status = ValidationService.validateResource(fileOrUrl);
              state.status = status;

              return status.$promise.then(function(results) {
                fileOrUrl.encoding = results.encoding;
                return fileOrUrl;
              });
            })
            .then(function(fileOrUrl) {
              var url = fileOrUrl;
              if (_.isString(url)) {
                url = UtilsService.decorateProxyUrl(url);
              }
              fileDescriptor = fileOrUrl;
              return $q(function(resolve, reject) {
                fiscalDataPackage.createResourceFromSource(url)
                  .then(resolve)
                  .catch(reject);
              }).then(_.identity);
            })
            .then(function(resource) {
              // Save file object - it will be needed when publishing
              // data package
              if (_.isObject(fileDescriptor)) {
                resource.descriptor = fileDescriptor;
              }
              if (_.isString(fileOrUrl)) {
                resource.source.url = fileOrUrl;
              }
              return resource;
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
              url: url,
              blob: resource.descriptor ? resource.descriptor.blob : null
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
              osDataStore.readContents(file)
                .then(function() {
                  return osDataStore.calculateMetrics(file);
                })
                .then(function() {
                  return osDataStore.prepareForUpload(file, {
                    // jscs:disable
                    permission_token: LoginService.permissionToken,
                    // jscs:enable
                    name: dataPackage.name,
                    owner: dataPackage.owner
                  });
                })
                .then(function() {
                  return osDataStore.upload(file);
                })
                .then(function() {
                  // datapackage.json has one more step in processing chain
                  if (file.name != Configuration.defaultPackageFileName) {
                    file.status = osDataStore.ProcessingStatus.READY;
                  }
                  return file;
                })
                .then(resolve)
                .catch(function(error) {
                  file.status = osDataStore.ProcessingStatus.FAILED;
                  file.error = error;
                  reject(error);
                });
            });
            return file;
          });

          files.$promise = $q(function(resolve, reject) {
            $q.all(_.map(files, function(item) {
              return item.$promise;
            }))
              .then(function(results) {
                packageFile.countOfLines = 0;
                _.each(files, function(file) {
                  if (file !== packageFile) {
                    packageFile.countOfLines += file.countOfLines;
                  }
                });
                osDataStore.publish(packageFile, {
                    // jscs:disable
                    permission_token: LoginService.permissionToken
                    // jscs:enable
                  })
                  .then(function() {
                    triggerDigest = null;
                    packageFile.status = osDataStore.ProcessingStatus.READY;
                    resolve(packageFile);
                  })
                  .catch(function(error) {
                    triggerDigest = null;
                    packageFile.status = osDataStore.ProcessingStatus.FAILED;
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
