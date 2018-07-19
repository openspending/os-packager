'use strict';

var _ = require('lodash');

var fiscalDataPackage = require('../../../services/package');
var utils = require('../../../services/utils');
var osDataStore = require('../../../services/os-datastore');

angular.module('Application')
  .factory('PackageService', [
    '$q', '$timeout', 'Configuration', 'LoginService',
    'ValidationService',
    function($q, $timeout, Configuration, LoginService,
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
                if (_.isObject(data)) {
                  attributes = data.attributes;
                  attributes.regionCode = attributes.regionCode || '';
                  attributes.countryCode = attributes.countryCode || '';
                  attributes.cityCode = attributes.cityCode || '';
                  resources = data.resources;
                  isExternalDataPackage = true;
                }
                resolve();
              })
              .catch(function(error) {
                isExternalDataPackage = true;
                console.error(error);
                reject(error);
              });
          });
        },
        createResource: function(fileOrUrl, state) {
          var fileDescriptor = null;
          var encoding;
          return $q(function(resolve, reject) {
            fiscalDataPackage.transformResourceUrl(fileOrUrl)
              .then(resolve)
              .catch(reject);
          })
            .then(function(newFileOrUrl) {
              fileOrUrl = newFileOrUrl;
              return $q(function(resolve, reject) {
                utils.blobToFileDescriptor(fileOrUrl)
                  .then(resolve)
                  .catch(reject);
              });
            })
            .then(function(fileOrUrl) {
              state.status = {
                state: 'checking'
              };
              return ValidationService.validateResource(fileOrUrl)
                .then(function(report) {
                  encoding = report.tables[0].encoding;
                  state.status = {
                    state: 'completed',
                    report: report
                  };
                  return fileOrUrl;
                })
                .catch(function(error) {
                  state.status = {
                    state: null
                  };
                  Configuration.defaultErrorHandler(error);
                });
            })
            .then(function(fileOrUrl) {
              fileDescriptor = fileOrUrl;
              return $q(function(resolve, reject) {
                fiscalDataPackage.createResourceFromSource(fileOrUrl, encoding)
                  .then(resolve)
                  .catch(reject);
              });
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
          return $q(function(resolve, reject) {
            var permissionToken = LoginService.permissionToken;
            osDataStore.isDataStoreUrl(permissionToken)
              .then(function(isDataStoreUrl) {
                var files = _.chain(resources)
                  .map(function(resource) {
                    if (_.isString(resource.source.originUrl)) {
                      if (isDataStoreUrl(resource.source.originUrl)) {
                        // Skip files that are already at datastore
                        return;
                      }
                    }

                    var url = resource.source.url;
                    if (_.isString(url) && (url.length > 0)) {
                      url = utils.decorateProxyUrl(url);
                    }
                    return {
                      name: resource.source.fileName || resource.name + '.csv',
                      url: url,
                      blob: resource.descriptor ?
                        resource.descriptor.blob : null
                    };
                  })
                  .filter()
                  .value();
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
                dataPackage.author = LoginService.name;

                var triggerDigest = function(immediateCall) {
                  if (_.isFunction(triggerDigest)) {
                    $timeout(triggerDigest, 500);
                  }
                  if (!!immediateCall) {
                    $timeout(function() {
                    });
                  }
                };

                function prepareFile(file) {
                  return $q(function(resolve, reject) {
                    triggerDigest(true);
                    osDataStore.readContents(file)
                      .then(function() {
                        return osDataStore.calculateMetrics(file);
                      })
                      .then(function() {
                        return osDataStore.prepareForUpload(file, {
                          permission_token: permissionToken,
                          name: dataPackage.name,
                          owner: dataPackage.owner
                        });
                      })
                      .then(function() {
                        return osDataStore.upload(file);
                      })
                      .then(function() {
                        // datapackage.json has one more step in
                        // processing chain
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
                }

                files = _.map(files, function(file) {
                  file.$promise = prepareFile(file);
                  return file;
                });
                var filesPromise = $q.all(_.map(files, function(item) {
                  return item.$promise;
                }));

                // Create and prepend datapackage.json
                var packageFile = {
                  name: Configuration.defaultPackageFileName,
                  data: dataPackage,
                  countOfLines: 0,
                  $promise: filesPromise.then(function() {
                    dataPackage.count_of_rows = 0;
                    _.each(files, function(file) {
                      var count = parseInt(file.countOfLines) || 0;
                      if (count < 0) {
                        count = 0;
                      }
                      dataPackage.count_of_rows += count;
                    });
                    return prepareFile(packageFile);
                  })
                };
                files.splice(0, 0, packageFile);

                files.$promise = $q(function(resolve, reject) {
                  $q.all(_.map(files, function(item) {
                    return item.$promise;
                  }))
                    .then(function() {
                      packageFile.countOfLines = dataPackage.count_of_rows;
                      osDataStore.publish(packageFile, {
                        permission_token: permissionToken
                      })
                        .then(function() {
                          triggerDigest = null;
                          packageFile.status =
                            osDataStore.ProcessingStatus.READY;
                          resolve(packageFile);
                        })
                        .catch(function(error) {
                          triggerDigest = null;
                          packageFile.status =
                            osDataStore.ProcessingStatus.FAILED;
                          packageFile.error = error;
                          reject(error);
                        });
                    })
                    .catch(reject);
                });

                return files;
              })
              .then(resolve)
              .catch(reject);
          });
        }
      };

      result.loadSchema();

      return result;
    }
  ]);
