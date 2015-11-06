'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var Goodtables = require('goodtables');
var csv = require('papaparse');
var jtsInfer = require('json-table-schema').infer;

module.exports.getCsvSchema = function(string) {
  return new Promise(function(resolve, reject) {
    var config = {
      preview: 1000,
      complete: function(results) {
        if (results.errors.length) {
          reject(results.errors);
        }
        var schema = jtsInfer(_.first(results.data), _.rest(results.data));
        resolve({
          data: string,
          rows: results.data,
          schema: schema
        });
      }
    };
    csv.parse(string, config);
  });
};

module.exports.validateData = function(data, schema) {
  var goodTables = new Goodtables({
    'method': 'post',
    'report_type': 'grouped'
  });
  return goodTables.run(data, JSON.stringify(schema))
    .then(function(results) {
      if (!results) {
        return false;
      }
      var groupped = results.getGroupedByRows();
      var headers = results.getHeaders();
      return _.map(groupped, function(item) {
        return _.extend(_.values(item)[0], {
          headers: headers
        });
      });
    });
};
