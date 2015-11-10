'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var utils = require('./utils');

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

module.exports = FiscalDataPackage;
