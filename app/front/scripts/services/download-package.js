'use strict';

var _ = require('lodash');

angular.module('Application')
  .factory('DownloadPackageService', [
    '$q', 'PackageService', 'StepsService', 'LoginService',
    function($q, PackageService, StepsService, LoginService) {
      var result = {};

      var state = {};

      result.resetState = function() {
        state = {};
      };

      result.getState = function() {
        return state;
      };

      result.generateMappings = function(fiscalDataPackage) {
        var result = [];

        var getResource = function(name) {
          if (!!name) {
            return _.find(fiscalDataPackage.resources, function(resource) {
              return resource.name == name;
            });
          }
          return _.first(fiscalDataPackage.resources);
        };

        // Measures
        _.each(fiscalDataPackage.model.measures, function(measure, name) {
          var resource = getResource(measure.resource);
          result.push({
            name: name,
            sources: [{
              fileName: resource.title || resource.name,
              fieldName: measure.title
            }]
          });
        });

        // Dimensions
        _.each(fiscalDataPackage.model.dimensions,
          function(dimension, name) {
            var sources = [];
            _.each(dimension.attributes, function(attribute) {
              var resource = getResource(attribute.resource);
              sources.push({
                fileName: resource.title || resource.name,
                fieldName: attribute.title
              });
            });
            result.push({
              name: name,
              sources: sources
            });
          });

        return result;
      };

      result.publishDataPackage = function() {
        state.packagePublicUrl = null;
        state.isUploading = true;
        PackageService.publish().then(function(files) {
          state.uploads = files;
          files.$promise
            .then(function() {
              var packageName = PackageService.getAttributes().name;
              var owner = LoginService.userId;
              state.packagePublicUrl = '/viewer/' + owner + ':' + packageName;
              state.uploads = null;
            })
            .finally(function() {
              state.isUploading = false;
            });
        });
        return state;
      };

      return result;
    }
  ]);
