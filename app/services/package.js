'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var datapackageValidate = require('datapackage-validate').validate;
var registry = require('datapackage-registry');
var OSTypes = require('os-types');
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
          title: resourceName,
          source: source,
          encoding: urlOrFile.encoding,
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
            _field.data =
              _.map(_.first(data.rows, 3),
                    function(row) { return row[index]; });
            return _field;
          })
        };
        resolve(resource);
        return data;
      })
      .catch(reject);
  });
};

module.exports.getFiscalDataPackageSchema = function(useProxy) {
  return 'fiscal';
};

module.exports.validateDataPackage = function(dataPackage, schema) {
  return new Promise(function(resolve, reject) {
    resolve(datapackageValidate(dataPackage, schema));
  });
};

module.exports.createFiscalDataPackage = function(attributes, resources) {

  // Use OSTypes to generate FDP
  var fields = resources[0].fields; //TODO: Add support for more than one resource once OSTypes supports it
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
      result.path = resource.name + '.csv';
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

  return fdp;
};
