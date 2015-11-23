'use strict';

var _ = require('underscore');
var GoodTables = require('goodtables');
var Promise = require('bluebird');
var csv = require('papaparse');
var jts = require('json-table-schema');
var inflector = require('inflected');

inflector.transliterations(function(t) {
  t.approximate('А', 'A');  t.approximate('а', 'a');
  t.approximate('Б', 'B');  t.approximate('б', 'b');
  t.approximate('В', 'V');  t.approximate('в', 'v');
  t.approximate('Г', 'G');  t.approximate('г', 'g');
  t.approximate('Ґ', 'G');  t.approximate('ґ', 'g');
  t.approximate('Д', 'D');  t.approximate('д', 'd');
  t.approximate('Е', 'E');  t.approximate('е', 'e');
  t.approximate('Є', 'Je'); t.approximate('є', 'je');
  t.approximate('Ж', 'Zh'); t.approximate('ж', 'zh');
  t.approximate('З', 'Z');  t.approximate('з', 'z');
  t.approximate('И', 'Y');  t.approximate('и', 'y');
  t.approximate('І', 'I');  t.approximate('і', 'i');
  t.approximate('Ї', 'Ji'); t.approximate('ї', 'ji');
  t.approximate('Й', 'J');  t.approximate('й', 'j');
  t.approximate('К', 'K');  t.approximate('к', 'k');
  t.approximate('Л', 'L');  t.approximate('л', 'l');
  t.approximate('М', 'M');  t.approximate('м', 'm');
  t.approximate('Н', 'N');  t.approximate('н', 'n');
  t.approximate('О', 'O');  t.approximate('о', 'o');
  t.approximate('П', 'P');  t.approximate('п', 'p');
  t.approximate('Р', 'R');  t.approximate('р', 'r');
  t.approximate('С', 'S');  t.approximate('с', 's');
  t.approximate('Т', 'T');  t.approximate('т', 't');
  t.approximate('У', 'U');  t.approximate('у', 'u');
  t.approximate('Ф', 'F');  t.approximate('ф', 'f');
  t.approximate('Х', 'H');  t.approximate('х', 'h');
  t.approximate('Ц', 'Ts'); t.approximate('ц', 'ts');
  t.approximate('Ч', 'Ch'); t.approximate('ч', 'ch');
  t.approximate('Ш', 'Sh'); t.approximate('ш', 'sh');
  t.approximate('Щ', 'Shch'); t.approximate('щ', 'shch');
  t.approximate('Ю', 'Ju'); t.approximate('ю', 'ju');
  t.approximate('Я', 'Ja'); t.approximate('я', 'ja');
  t.approximate('Ы', 'Y');  t.approximate('ы', 'y');
  t.approximate('Э', 'E');  t.approximate('э', 'e');
  t.approximate('Ё', 'Jo'); t.approximate('ё', 'jo');
});

module.exports.convertToTitle = function(string) {
  return inflector.titleize('' + (string || ''));
};

module.exports.convertToSlug = function(string) {
  return inflector.parameterize(inflector.transliterate('' + (string || '')));
};

module.exports.getCsvSchema = function(urlOrFile) {
  return new Promise(function(resolve, reject) {
    var config = {
      download: true,
      preview: 1000,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.errors.length) {
          reject(results.errors);
        }
        var headers = _.first(results.data);
        var rows = _.rest(results.data);
        var schema = jts.infer(headers, rows);
        resolve({
          raw: csv.unparse(results.data, {
            quotes: true,
            delimiter: ',',
            newline: '\r\n'
          }),
          headers: headers,
          rows: rows,
          schema: schema
        });
      }
    };
    csv.parse(urlOrFile, config);
  });
};

module.exports.validateData = function(data, schema, userEndpointURL) {
  var goodTables = new GoodTables({
    'method': 'post',
    'report_type': 'grouped'
  }, userEndpointURL);
  return goodTables.run(data, !!schema ? JSON.stringify(schema) : undefined)
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
    .map(function(TypeConstructor) {
      return new TypeConstructor();
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
