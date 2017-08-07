'use strict';

var _ = require('lodash');
var utils = require('../../../services/utils');

angular.module('Application')
  .factory('UploadFileService', [
    'PackageService', 'ValidationService', 'Configuration',
    function(PackageService, ValidationService, Configuration) {
      var result = {};

      var state = {};

      var onResetCallback = null;
      result.onReset = function(cbk) {
        onResetCallback = cbk;
      };

      result.resetState = function() {
        state = {};
        PackageService.recreatePackage();
        onResetCallback && onResetCallback();
      };

      var validateSource = function(source) {
        state.status = {
          state: 'reading'
        };

        PackageService.createResource(source, state)
          .then(function(resource) {
            var status = state.status;
            status.sampleSize = resource.data.rows.length;
            if (resource.data.headers) {
              status.sampleSize += 1;
            }

            if (status.report.valid) {
              PackageService.removeAllResources();
              if (resource) {
                PackageService.addResource(resource);
              }
              return resource;
            }
          })
          .catch(function(error) {
            state.status = null;
            Configuration.defaultErrorHandler(error);
          });
      };

      result.getState = function() {
        return state;
      };

      result.resourceChanged = function(file, url) {
        if (utils.isUrl(url)) {
          state.isUrl = true;
          state.url = url;
          validateSource(url);
          return state;
        }
        if (_.isObject(file)) {
          state.isFile = true;
          state.file = {
            name: file.name,
            type: file.type,
            size: file.size
          };
          validateSource(file);
          return state;
        }
        state = {};
        PackageService.recreatePackage();
        return state;
      };

      return result;
    }
  ]);
