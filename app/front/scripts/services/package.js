;(function(angular) {

  angular.module('Application')
    .factory('PackageService', [
      '$q', '_', 'Services', 'UtilsService', 'Configuration',
      function($q, _, Services, UtilsService, Configuration) {
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
                    resource.file = fileOrUrl;
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
                url: resource.url,
                file: resource.blob
              };
            });
            var modifiedResources = _.map(resources, function(resource) {
              resource = _.clone(resource);
              resource.path = resource.name + '.csv';
              return resource;
            });
            var dataPackage = fiscalDataPackage.createFiscalDataPackage(
              attributes, modifiedResources);
            files.push({
              name: Configuration.defaultPackageFileName,
              data: dataPackage
            });

            return _.map(files, function(file) {
              file.$promise = UtilsService.promisify(
                Services.datastore.readContents(file))
                .then(function() {
                  return UtilsService.promisify(
                    Services.datastore.prepareForUpload(file, {
                      name: dataPackage.name
                    }));
                })
                .then(function() {
                  return UtilsService.promisify(
                    Services.datastore.upload(file));
                })
                .then(function() {
                  file.status = Services.datastore.ProcessingStatus.READY;
                })
                .catch(function(error) {
                  file.status = Services.datastore.ProcessingStatus.FAILED;
                  file.error = error;
                  Configuration.defaultErrorHandler(error);
                });
              return file;
            });
          }
        };
      }
    ]);

})(angular);
