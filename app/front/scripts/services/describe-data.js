'use strict';

var OSTypes = require('os-types');
var _ = require('lodash');
var datapackage = require('datapackage');
var tableschema = require('tableschema');
var Promise = require('bluebird');

angular.module('Application')
  .factory('DescribeDataService', [
    'PackageService', 'UtilsService', 'ValidationService',
    function(PackageService, UtilsService, ValidationService) {
      var result = {};

      var state = {};

      result.resetState = function() {
        state = {};
      };

      result.getState = function() {
        return state;
      };

      result.loadSchema = function(schema) {
        /*
          Return an FDP fields object from either a datapackage, dataresource,
          or tablschema.
        */

        // Is it JSON?
        try {
          var parsedSchema = JSON.parse(schema);
        } catch(e) {
          Promise.reject(new Error('Schema file could no be parsed as JSON.'));
        }

        // Is it a datapackage?
        var dpPromise = datapackage.Package.load(parsedSchema, {strict: true})
          .then(function(dp) {
            return dp.resources[0].descriptor.schema.fields;
          });

        // Is it a resource?
        var resPromise = datapackage.Resource.load(parsedSchema, {strict: true})
          .then(function(res) {
            return res.descriptor.schema.fields;
          });

        // Is it a tableschema?
        var schemaPromise =
          tableschema.Schema.load(parsedSchema, {strict: true})
          .then(function(sch) {
            return sch.descriptor.fields;
          });

        // Return the first that resolves!
        return Promise.some([dpPromise, resPromise, schemaPromise], 1)
          .spread(function(fields) {
            return fields;
          });
      };

      result.schemaChanged = function(fileContent) {
        state = {};
        state.errors = [];

        return this.loadSchema(fileContent)
          .then(function(fields) {
            PackageService.presetResourceFields(fields);
            return result.updateField();
          })
          .catch(function(err) {
            console.log(err);
            state.errors.push({
              msg: 'Problem loading the schema file. ' +
                   'Must be a valid datapackage, dataresource, ' +
                   'or tableschema.'});
          });
      };

      result.getSelectedConcepts = function(conceptType) {
        var mapped = [];
        var resources = PackageService.getResources();
        _.each(resources, function(resource) {
          _.each(resource.fields, function(field) {
            if (field.conceptType == conceptType) {
              mapped.push(field);
            }
          });
        });
        return mapped;
      };

      result.updateField = function() {
        var fields = PackageService.getResources()[0].fields;
        // TODO: Support more than 1 resource when OSTypes supports it
        _.forEach(fields, function(field) {
          delete field.errors;
          delete field.additionalOptions;
          delete field.slug;
        });
        var fdp = new OSTypes().fieldsToModel(fields);
        var promise = fdp.promise || Promise.resolve();
        return promise.then(function() {
          if (fdp.errors) {
            _.forEach(fields, function(field) {
              var fieldErrors = fdp.errors.perField[field.name];
              if (fieldErrors) {
                field.errors = fieldErrors;
              }
            });
          }
          _.forEach(fields, function(field) {
            if (fdp.schema && fdp.schema.fields &&
              fdp.schema.fields[field.name]) {
              var schemaField = fdp.schema.fields[field.name];
              field.additionalOptions = schemaField.options;
              if (!field.options) {
                field.options = {};
              }
              _.forEach(field.additionalOptions, function(option) {
                if (option.name == 'currency') {
                  option.values = _.map(UtilsService.getCurrencies(),
                    function(item) {
                      return {
                        name: item.code + ' ' + item.name,
                        value: item.code
                      };
                    });
                  option.defaultValue =
                    UtilsService.getDefaultCurrency().code;
                }

                var existing = field.options[option.name];
                if (_.isUndefined(existing)) {
                  if (_.has(option, 'defaultValue')) {
                    field.options[option.name] = option.defaultValue;
                  }
                }
              });
            } else {
              field.additionalOptions = [];
              field.options = {};
            }
          });

          state.errors = [];
          if (fdp.errors) {
            if (fdp.errors.general) {
              _.every(fdp.errors.general, function(msg) {
                state.errors.push({msg: msg});
              });
            }
            if (fdp.errors.perField) {
              _.forEach(fdp.errors.perField, function(msgs, field) {
                _.every(msgs, function(msg) {
                  state.errors.push({field: field, msg: msg});
                });
              });
            }
          }

          state.status = ValidationService.validateRequiredConcepts(
            fdp.errors,
            PackageService.getResources());

          return state;
        });
      };

      return result;
    }
  ]);
