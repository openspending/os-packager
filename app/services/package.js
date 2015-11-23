'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var datapackageValidate = require('datapackage-validate').validate;
var request = require('request');
var registry = require('datapackage-registry');
var utils = require('./utils');

function getResourceName(resource, index) {
  return resource.name || 'resource_' + index;
}

function FiscalDataPackage() {
  this.attributes = {};
  this.resources = [];

  this.resources.add = function(resource) {
    this.push(resource);
  };

  this.resources.clear = function() {
    this.splice(0, this.length);
  };

  this.resources.createFromSource = function(urlOrFile) {
    return new Promise(function(resolve, reject) {
      utils.getCsvSchema(urlOrFile)
        .then(function(data) {
          var source = {};
          if (_.isObject(urlOrFile)) {
            source.fileName = urlOrFile.name;
            source.mimeType = urlOrFile.type;
            source.size = urlOrFile.size;
          } else {
            source.url = urlOrFile;
          }

          var resource = {
            source: source,
            data: {
              headers: data.headers,
              rows: data.rows,
              raw: data.raw
            },
            fields: _.map(data.schema.fields, function(field) {
              field = _.clone(field);
              field.concept = field.concept || '';
              field.concept += '';
              field.title = utils.convertToTitle(field.name);
              return field;
            })
          };

          resolve(resource);
          return data;
        })
        .catch(reject);
    });
  };
}

FiscalDataPackage.prototype.createFiscalDataPackage = function() {
  var result = {};

  // Package metadata
  _.extend(result, _.pick(this.attributes, function(value) {
    return !!value;
  }));

  // Resources
  result.resources = _.map(this.resources, function(resource, index) {
    var result = {};
    result.name = getResourceName(resource, index);
    result.format = 'csv';
    if (resource.source.url) {
      result.url = resource.source.url;
    } else {
      result.path = resource.source.fileName;
    }
    if (resource.source.mimeType) {
      result.mediatype = resource.source.mimeType;
    }
    if (resource.source.size) {
      result.bytes = resource.source.size;
    }
    result.schema = {
      fields: _.map(resource.fields, function(field) {
        field = _.clone(field);
        delete field.concept;
        return field;
      })
    };
    return result;
  });

  // Mappings
  result.mapping = {
    measures: {},
    dimensions: {}
  };

  var groups = {};
  _.each(this.resources, function(resource, index) {
    _.each(resource.fields, function(field) {
      if (field.concept) {
        groups[field.concept] = groups[field.concept] || [];
        groups[field.concept].push(_.extend({
          resource: getResourceName(resource, index)
        }, field));
      }
    });
  });

  _.each(groups, function(fields, concept) {
    switch (concept) {
      case 'mapping.measures.amount': {
        _.each(fields, function(field) {
          result.mapping.measures.amount = {
            name: 'amount',
            source: field.name,
            resource: field.resource,
            currency: 'USD' // TODO: Hardcode !!!
          };
        });
        break;
      }
      case 'mapping.date.properties.year':
      case 'mapping.classification.properties.id':
      case 'mapping.classification.properties.label':
      case 'mapping.entity.properties.id':
      case 'mapping.entity.properties.label': {
        var matches = /^mapping\.([a-z]+)\.properties\.([a-z]+)$/g
          .exec(concept);
        result.mapping.dimensions[matches[1]] = {
          name: matches[1],
          fields: _.map(fields, function(field) {
            return {
              name: field.name,
              source: field.name
            };
          })
        };
        break;
      }
    }
  });

  return result;
};

FiscalDataPackage.prototype.validateFiscalDataPackage = function() {
  var dataPackage = this.createFiscalDataPackage();
  return this.loadSchema().then(function(schema) {
    return datapackageValidate(dataPackage, schema);
  });
};

FiscalDataPackage.prototype.schema = null;

FiscalDataPackage.prototype.loadSchema = function(forceReload) {
  if (!FiscalDataPackage.prototype.schema || forceReload) {
    var schemaID = 'fiscal';
    return new Promise(function(resolve, reject) {
      registry.get().then(function(result) {
        var profile = _.findWhere(result, {id: schemaID});

        if (!profile) {
          reject('No profile found with id ' + schemaID);
          return null;
        }

        request(profile.schema, function(error, response, data) {
          if (error) {
            reject('Failed loading schema from ' + profile.schema);
            return null;
          }

          try {
            FiscalDataPackage.prototype.schema = JSON.parse(data);
            resolve(FiscalDataPackage.prototype.schema);
          } catch (e) {
            reject('Failed parsing schema json from ' + profile.schema);
          }
        });
      }, function() {
        reject('Registry request failed');
      });
    });
  } else {
    return Promise.resolve(FiscalDataPackage.prototype.schema);
  }
};

module.exports = FiscalDataPackage;
