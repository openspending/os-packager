'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var GoodTables = require('goodtables');
var csv = require('papaparse');
var jts = require('json-table-schema');

module.exports.getCsvSchema = function(string) {
  return new Promise(function(resolve, reject) {
    var config = {
      preview: 1000,
      complete: function(results) {
        if (results.errors.length) {
          reject(results.errors);
        }
        var headers = _.first(results.data);
        var rows = _.rest(results.data);
        var schema = jts.infer(headers, rows);
        resolve({
          data: string,
          headers: headers,
          rows: rows,
          schema: schema
        });
      }
    };
    csv.parse(string, config);
  });
};

module.exports.validateData = function(data, schema) {
  var goodTables = new GoodTables({
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

module.exports.getAvailableDataTypes = function() {
  return _.chain(jts.types)
    .filter(function(item, key) {
      return (key != 'JSType') && (key.substr(-4) == 'Type');
    })
    .map(function(item) {
      return new item();
    })
    .value();
};

module.exports.getAvailableConcepts = function() {
  return [
    {
      name: 'Amount',
      id: 'mapping.measures.amount'
    },
    {
      name: 'Date / Time',
      id: 'mapping.date.properties.year'
    },
    {
      name: 'Classification',
      id: 'mapping.classification.properties.id'
    },
    {
      name: 'Classification > ID',
      id: 'mapping.classification.properties.id'
    },
    {
      name: 'Classification > Label',
      id: 'mapping.classification.properties.label'
    },
    {
      name: 'Entity',
      id: 'mapping.entity.properties.id'
    },
    {
      name: 'Entity > ID',
      id: 'mapping.entity.properties.id'
    },
    {
      name: 'Entity > Label',
      id: 'mapping.entity.properties.label'
    }
  ];
};
