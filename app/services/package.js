'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var datapackage = require('datapackage');
var OSTypes = require('os-types');
var utils = require('./utils');
var url = require('url');
var datastore = require('./os-datastore');
require('isomorphic-fetch');

var defaultOptions = {
  adapterUrl: '//next.openspending.org/fdp-adapter/convert'
};
module.exports.defaultOptions = defaultOptions;

function transformResourceUrl(url) {
  if (!utils.isUrl(url)) {
    return Promise.resolve(url);
  }
  var adapterUrl = defaultOptions.adapterUrl + '?url=' +
    encodeURIComponent(url);
  return fetch(adapterUrl)
    .then(function(response) {
      if (response.status != 200) {
        return url;
      }
      return response.text();
    })
    .then(function(data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return url;
      }
    })
    .then(function(dataPackage) {
      if (!_.isObject(dataPackage)) {
        return dataPackage;
      }
      return _.first(dataPackage.resources).url;
    });
}

function createResourceFromSource(urlOrFile, encoding) {
  return utils.getCsvSchema(urlOrFile, encoding)
    .then(function(data) {
      var resourceName = null;
      var source = {};
      if (_.isObject(urlOrFile)) {
        source.fileName = urlOrFile.name;
        source.mimeType = urlOrFile.type;
        source.size = urlOrFile.size;
        resourceName = utils.createNameFromPath(urlOrFile.name);
      } else {
        source.url = urlOrFile;
        resourceName = utils.createNameFromUrl(urlOrFile);
      }

      var dataColumns = _.unzip(data.rows || []);

      return {
        name: resourceName,
        title: resourceName,
        source: source,
        encoding: encoding,
        data: {
          headers: data.headers,
          rows: data.rows,
          raw: data.raw
        },
        dialect: {
          csvddfVersion: 1.0,
          delimiter: data.dialect.delimiter,
          lineTerminator: data.dialect.linebreak
        },
        fields: _.map(data.schema.fields, function(field, index) {
          var _field = {};
          _field.type = '';
          _field.name = field.name;
          _field.title = field.name;
          _field.data = _.slice(dataColumns[index], 0, 3);
          return _field;
        })
      };
    });
}

function getFiscalDataPackageSchema(useProxy) {
  return 'fiscal';
}

function validateDataPackage(descriptor, schema) {
  return datapackage.validate(descriptor, schema, true)
    .then(function(validation) {
        return validation == true;
    });
}

function createFiscalDataPackage(attributes, resources) {
  // Use OSTypes to generate FDP
  //TODO: Add support for more than one resource once OSTypes supports it
  var fields = resources[0].fields;
  _.forEach(fields, function(field) {
    delete field.errors;
    delete field.additionalOptions;
    delete field.slug;
  });
  var fdp = new OSTypes().fieldsToModel(fields);

  // Package metadata
  _.extend(fdp, utils.removeEmptyAttributes(attributes));

  // Resources
  fdp.resources = _.map(resources, function(resource) {
    var result = {};
    result.name = resource.name;
    result.format = 'csv';
    if (resource.source.url) {
      result.url = resource.source.url;
    } else {
      result.path = resource.source.fileName || resource.name + '.csv';
    }
    if (resource.source.mimeType) {
      result.mediatype = resource.source.mimeType;
    }
    if (resource.source.size) {
      result.bytes = resource.source.size;
    }
    if (resource.dialect) {
      result.dialect = _.clone(resource.dialect);
    }
    if (resource.encoding) {
      result.encoding = resource.encoding;
    }
    result.schema = fdp.schema;
    result.schema.fields = _.map(
      _.values(result.schema.fields),
      function(field) {
        return _.omit(field, 'options');
      }
    );
    delete fdp.schema;
    return result;
  });

  // JSON-LD
  fdp['@context'] = 'http://schemas.frictionlessdata.io/' +
    'fiscal-data-package.jsonld';

  return fdp;
}

function convertResource(resource, dataPackage, dataPackageUrl) {
  var resourceUrl = resource.url || url.resolve(dataPackageUrl, resource.path);
  return createResourceFromSource(resourceUrl)
    .then(function(result) {
      // Copy some properties from original resource
      // to keep them when re-assembling datapackage.json
      result.name = resource.name;
      result.dialect = resource.dialect;
      result.encoding = resource.encoding;
      result.source.url = resource.url;
      result.source.fileName = resource.path;
      result.source.mimeType = resource.mediatype;
      result.source.size = resource.bytes;
      result.source.originUrl = resourceUrl;
      _.each(result.fields, function(field) {
        var originalField = _.find(resource.schema.fields, {
          name: field.name
        });
        if (originalField) {
          field.name = originalField.name;
          field.title = originalField.title;
          field.slug = originalField.slug;
          field.type = originalField.osType;

          var allowedOptionFields = _.map(
            new OSTypes().getDataTypeExtraOptions(field.type),
            function(option) {
              return option.name;
            }
          );

          // Populate additional properties
          field.options = _.pick(originalField, allowedOptionFields);

          var measure = _.find(dataPackage.model.measures, function(item) {
            return item.source == field.name;
          });
          if (measure) {
            var excludeFields = ['resource', 'source', 'title'];
            _.extend(field.options, _.chain(measure)
            .map(function(value, key) {
              if (excludeFields.indexOf(key) == -1) {
                return [key, value];
              }
            })
            .filter()
            .fromPairs()
            .value());
          }

          _.each(dataPackage.model.dimensions, function(dimension) {
            var attr = _.find(dimension.attributes, function(item) {
              return item.source == field.name;
            });
            if (attr) {
              _.extend(field.options, _.pick(attr, allowedOptionFields));
              // Field can belong only to one dimension, so once we found it -
              // break the loop
              return false;
            }
          });

          if (_.isString(field.options.format)) {
            field.options.format = field.options.format.replace(/^fmt:/g, '');
          }
        }
      });
      return result;
    });
}

function loadFiscalDataPackage(dataPackageUrl, userId) {
  if (!utils.isUrl(dataPackageUrl)) {
    return Promise.resolve(null);
  }
  var result = {
    attributes: {},
    resources: []
  };
  return fetch(dataPackageUrl)
    .then(function(response) {
      if (response.status != 200) {
        throw 'Failed to load data from ' + response.url;
      }
      return response.json();
    })
    .then(function(dataPackage) {
      // User can edit only own files
      if (userId && dataPackage.owner && (dataPackage.owner != userId)) {
        throw new Error('Permission denied: you can edit ' +
          'only own data packages.');
      }

      var exceptFields = ['resources', 'model', '@context'];
      _.each(dataPackage, function(value, key) {
        if (exceptFields.indexOf(key) == -1) {
          result.attributes[key] = value;
        }
      });
      var promises = _.map(dataPackage.resources, function(resource) {
        return convertResource(resource, dataPackage, dataPackageUrl);
      });
      return Promise.all(promises);
    })
    .then(function(resources) {
      result.resources = resources;
    })
    .then(function() {
      return result;
    });
}

module.exports.createResourceFromSource = createResourceFromSource;
module.exports.getFiscalDataPackageSchema = getFiscalDataPackageSchema;
module.exports.validateDataPackage = validateDataPackage;
module.exports.createFiscalDataPackage = createFiscalDataPackage;
module.exports.loadFiscalDataPackage = loadFiscalDataPackage;
module.exports.transformResourceUrl = transformResourceUrl;
