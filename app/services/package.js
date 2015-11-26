'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var datapackageValidate = require('datapackage-validate').validate;
var registry = require('datapackage-registry');
var utils = require('./utils');
require('isomorphic-fetch');

function getResourceName(resource, index) {
  return resource.name || 'resource_' + index;
}

function FiscalDataPackage() {
  this.attributes = {};
  this.resources = [];

  this.resources.add = function(resource) {
    resource.name = utils.createUniqueResourceName(
      getResourceName(resource, this.length), this);
    this.push(resource);
  };

  this.resources.clear = function() {
    this.splice(0, this.length);
  };

  this.resources.createFromSource = function(urlOrFile) {
    return new Promise(function(resolve, reject) {
      utils.getCsvSchema(urlOrFile)
        .then(function(data) {
          var resourceName = null;
          var source = {};
          if (_.isObject(urlOrFile)) {
            source.fileName = urlOrFile.name;
            source.mimeType = urlOrFile.type;
            source.size = urlOrFile.size;
            resourceName = utils.createNameFromPath(urlOrFile.name);
          } else {
            source.url = utils.undecorateProxyUrl(urlOrFile);
            resourceName = utils.createNameFromUrl(urlOrFile);
          }

          var dataColumns = _.unzip((data.rows || []).slice(0, 3));

          var resource = {
            name: resourceName,
            title: utils.convertToTitle(resourceName),
            source: source,
            data: {
              headers: data.headers,
              rows: data.rows,
              raw: data.raw
            },
            fields: _.map(data.schema.fields, function(field, index) {
              field = _.clone(field);
              field.concept = (field.concept || '') + '';
              field.inferredType = field.type;
              field.title = utils.convertToTitle(field.name);
              field.allowedTypes = utils.getAllowedTypesForValues(
                dataColumns[index]);
              field.allowedConcepts = utils.getAllowedConcepts(
                field.allowedTypes);
              field.currencyCode = utils.defaultCurrency.code;
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
        delete field.inferredType;
        delete field.allowedTypes;
        delete field.allowedConcepts;
        delete field.currencyCode;
        return field;
      })
    };
    return result;
  });

  // Mappings
  result.mapping = {
    measures: [],
    dimensions: []
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
    concept = _.find(utils.availableConcepts, function(item) {
      return item.id == concept;
    });
    if (!concept || !concept.map) {
      return;
    }
    switch (concept.group) {
      case 'measure': {
        _.each(fields, function(field) {
          result.mapping.measures.push({
            name: concept.map.name,
            source: field.name,
            resource: field.resource,
            currency: (field.currencyCode + '').toUpperCase().substr(0, 3)
          });
        });
        break;
      }
      case 'dimension': {
        result.mapping.dimensions.push({
          name: concept.map.name,
          dimensionType: concept.map.dimensionType,
          fields: _.map(fields, function(field) {
            return {
              name: field.name,
              source: field.name,
              resource: field.resource
            };
          })
        });
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
      var options = {
        backend: '/proxy?url=' + encodeURIComponent('https://rawgit.com/' +
          'dataprotocols/registry/master/registry.csv')
      };
      registry.get(options).then(function(result) {
        var profile = _.findWhere(result, {id: schemaID});

        if (!profile) {
          reject('No profile found with id ' + schemaID);
          return null;
        }

        var options = {
          method: 'GET'
        };
        fetch('/proxy?url=' + encodeURIComponent(profile.schema), options)
          .then(function(res) {
            if (res.status != 200) {
              reject('Failed loading schema from ' + profile.schema);
            }
            return res.text();
          })
          .then(function(data) {
            try {
              FiscalDataPackage.prototype.schema = JSON.parse(data);
              resolve(FiscalDataPackage.prototype.schema);
            } catch (e) {
              reject('Failed parsing schema json from ' + profile.schema);
            }
          })
          .catch(reject);
      }, function() {
        reject('Registry request failed');
      });
    });
  } else {
    return Promise.resolve(FiscalDataPackage.prototype.schema);
  }
};

module.exports = FiscalDataPackage;
