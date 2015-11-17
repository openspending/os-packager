'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var datapackageValidate = require('datapackage-validate').validate;
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

  this.resources.createFromReader = function(reader) {
    return new Promise(function(resolve, reject) {
      reader
        .then(function(data) {
          return utils.getCsvSchema(data);
        })
        .then(function(data) {
          var source = {};
          if (reader.url) {
            source.url = reader.url;
          }
          if (reader.file) {
            source.fileName = reader.file.name;
            source.mimeType = reader.file.type;
            source.size = reader.file.size;
          }

          var resource = {
            source: source,
            data: {
              headers: data.headers,
              rows: data.rows,
              bytes: data.data
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
    return value !== undefined;
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
    if (resource.data.bytes) {
      //result.data = resource.data.bytes;
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
  return datapackageValidate(this.createFiscalDataPackage(), 'fiscal');
};

module.exports = FiscalDataPackage;
