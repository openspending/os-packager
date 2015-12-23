'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var datapackageValidate = require('datapackage-validate').validate;
var registry = require('datapackage-registry');
var utils = require('./utils');
require('isomorphic-fetch');

module.exports.createResourceFromSource = function(urlOrFile) {
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

        var dataColumns = _.unzip(data.rows || []);

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
              dataColumns[index], field.inferredType);
            field.allowedConcepts = utils.getAllowedConcepts(
              field.allowedTypes);
            return field;
          })
        };

        resolve(resource);
        return data;
      })
      .catch(reject);
  });
};

module.exports.getFiscalDataPackageSchema = function() {
  return module.exports.getDataPackageSchema('fiscal');
};

module.exports.getDataPackageSchema = function(schemaId) {
  return new Promise(function(resolve, reject) {
    var options = {
      backend: '/proxy?url=' + encodeURIComponent('https://rawgit.com/' +
        'dataprotocols/registry/master/registry.csv')
    };
    registry.get(options).then(function(result) {
      var profile = _.findWhere(result, {id: schemaId});

      if (!profile) {
        reject('No profile found with id ' + schemaId);
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
            var schema = JSON.parse(data);
            resolve(schema);
          } catch (e) {
            reject('Failed parsing schema json from ' + profile.schema);
          }
        })
        .catch(reject);
    }, function() {
      reject('Registry request failed');
    });
  });
};

module.exports.validateDataPackage = function(dataPackage, schema) {
  return new Promise(function(resolve, reject) {
    resolve(datapackageValidate(dataPackage, schema));
  });
};

module.exports.createFiscalDataPackage = function(attributes, resources) {
  var result = {};

  // Package metadata
  _.extend(result, utils.removeEmptyAttributes(attributes));

  // Resources
  result.resources = _.map(resources, function(resource) {
    var result = {};
    result.name = resource.name;
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
        delete field.options;
        delete field.additionalOptions;
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
  _.each(resources, function(resource) {
    _.each(resource.fields, function(field) {
      if (field.concept) {
        groups[field.concept] = groups[field.concept] || [];
        groups[field.concept].push(_.extend({
          resource: resource.name
        }, field));
      }
    });
  });

  var createMappingFromField = function(field) {
    return _.extend(utils.removeEmptyAttributes(field.options), {
      source: field.name,
      resource: field.resource
    });
  };

  var mappingName = null;
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
          mappingName = utils.createUniqueName(
            utils.convertToSlug(field.title || field.name),
            _.keys(result.mapping.measures));
          result.mapping.measures[mappingName] = createMappingFromField(field);
        });
        break;
      }
      case 'dimension': {
        mappingName = utils.createUniqueName(
          utils.convertToSlug(
            _.map(fields, function(field) {
              return field.title || field.name;
            }).join(' ')),
            _.keys(result.mapping.dimensions));
        result.mapping.dimensions[mappingName] = {
          dimensionType: concept.map.dimensionType,
          primaryKey: _.pluck(fields, 'name'),
          attributes: _.object(_.map(fields, function(field) {
            return [
              utils.convertToSlug(field.name),
              createMappingFromField(field)
            ];
          }))
        };
        break;
      }
    }
  });

  return result;
};
