'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var utils = require('./utils');

function FiscalDataPackage() {
  this.resources = [];

  this.resources.add = function(reader) {
    var array = this;
    return new Promise(function(resolve, reject) {
      reader
        .then(function(data) {
          return utils.getCsvSchema(data);
        })
        .then(function(resource) {
          return utils.validateData(resource.data,
            resource.schema).then(function(results) {
              if (results.length == 0) {
                var schema = resource.schema;
                _.each(schema.fields, function(field) {
                  field.concept = field.concept || '';
                  field.concept += '';
                  field.title = utils.convertToTitle(field.name);
                });

                var source = {};
                if (reader.url) {
                  source.url = reader.url;
                }
                if (reader.file) {
                  source.fileName = reader.file.name;
                  source.mimeType = reader.file.type;
                  source.size = reader.file.size;
                }

                array.push({
                  source: source,
                  data: {
                    headers: resource.headers,
                    rows: resource.rows,
                    bytes: resource.data
                  },
                  schema: schema
                });
              }
              return results;
            });
        })
        .then(resolve)
        .catch(reject);
    });
  };
}

module.exports = FiscalDataPackage;
