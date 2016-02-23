'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var datapackageValidate = require('datapackage-validate').validate;
var registry = require('datapackage-registry');
var utils = require('./utils');
require('isomorphic-fetch');

var dataPackageRegistryUrl = 'http://schemas.datapackages.org/registry.csv';

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

module.exports.getFiscalDataPackageSchema = function(useProxy) {
  return module.exports.getDataPackageSchema('fiscal', useProxy);
};

module.exports.getDataPackageSchema = function(schemaId, useProxy) {
  return new Promise(function(resolve, reject) {
    var options = {
      backend: dataPackageRegistryUrl
    };
    if (_.isUndefined(useProxy) || !!useProxy) {
      options = {
        backend: 'proxy?url=' + encodeURIComponent(dataPackageRegistryUrl)
      };
    }
    registry.get(options).then(function(result) {
      var profile = _.findWhere(result, {id: schemaId});

      if (!profile) {
        reject('No profile found with id ' + schemaId);
        return null;
      }

      var options = {
        method: 'GET'
      };

      var url = profile.schema;
      if (_.isUndefined(useProxy) || !!useProxy) {
        url = 'proxy?url=' + encodeURIComponent(profile.schema);
      }
      fetch(url, options)
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

  // Model
  result.model = {
    measures: {},
    dimensions: {}
  };

  var groups = {};
  _.each(resources, function(resource) {
    _.each(resource.fields, function(field) {
      if (field.concept) {
        var key = [field.concept];
        if (_.isObject(field.options) && field.options.classificationType) {
          key.push(field.options.classificationType);
        }
        key = JSON.stringify(key);
        groups[key] = groups[key] || [];
        groups[key].push(_.extend({
          resource: resource.name
        }, field));
      }
    });
  });

  var createMappingFromField = function(field) {
    var options = _.isObject(field.options) ? field.options : {};
    options = _.clone(options);
    options.classificationType = '';
    return _.extend(utils.removeEmptyAttributes(options), {
      source: field.name,
      resource: field.resource
    });
  };

  var allConcepts = function() {
    return _.keys(result.model.dimensions).concat(_.keys(result.model.measures));
  }


  var mappingName = null;
  _.each(groups, function(fields, concept) {
    var optionalAttributes = {};
    concept = JSON.parse(concept);
    if (concept.length > 1) {
      optionalAttributes.classificationType = concept[1];
    }

    concept = _.first(concept);
    concept = _.find(utils.availableConcepts, function(item) {
      return item.id == concept;
    });
    if (!concept || !concept.dimensionType) {
      return;
    }
    var conceptName = concept.dimensionType + ' ' + (optionalAttributes.classificationType || '');
    switch (concept.group) {
      case 'measure': {
        _.each(fields, function(field) {
          mappingName = utils.createUniqueName(
            utils.convertToSlug(field.title || field.name),
              allConcepts());
          result.model.measures[mappingName] = createMappingFromField(field);
        });
        break;
      }
      case 'dimension': {
        mappingName = utils.createUniqueName(
          utils.convertToSlug(conceptName), allConcepts());
        var attributes = [];
        _.each(fields, function(field) {
          attributes.push([
            utils.createUniqueName(
              utils.convertToSlug(field.title || field.name),
              _.map(attributes, _.first)
            ),
            createMappingFromField(field)
          ]);
        });
        result.model.dimensions[mappingName] = _.extend(optionalAttributes, {
          dimensionType: concept.dimensionType,
          primaryKey: _.map(attributes, _.first),
          attributes: _.object(attributes)
        });
        break;
      }
    }
  });

  return result;
};
