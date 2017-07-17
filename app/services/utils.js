'use strict';

var _ = require('lodash');
var GoodTables = require('goodtables');
var Promise = require('bluebird');
var csv = require('papaparse');
var jts = require('jsontableschema');
var inflector = require('inflected');
var path = require('path');
var url = require('url');
var validator = require('validator');

var defaultOptions = {
  proxyUrl: null
};
module.exports.defaultOptions = defaultOptions;

function isUrl(url) {
  return validator.isURL(url);
}

function decorateProxyUrl(urlToDecorate) {
  if (defaultOptions.proxyUrl) {
    return defaultOptions.proxyUrl + encodeURIComponent(urlToDecorate);
  }
  return urlToDecorate;
}

function convertToSlug(string) {
  var ret = inflector.parameterize(
    inflector.transliterate('' + (string || '')));
  if (ret === '') {
    return 'slug';
  }
  return ret;
}

function getPapaParseError(parseErrors) {
  parseErrors = _.filter(parseErrors, function(error) {
    // Delimiter was not auto-detected (defaults used).
    // We'll not treat this as an error
    var delimiterNotDetected = (error.type == 'Delimiter') &&
      (error.code == 'UndetectableDelimiter');

    return !delimiterNotDetected;
  });
  if (parseErrors.length > 0) {
    return new Error(parseErrors[0].message);
  }
}

function getCsvSchema(urlOrFile, encoding) {
  var data = [];
  var meta = null;
  var errors = [];
  return new Promise(function(resolve, reject) {
    var config = {
      download: true,
      preview: 1000,
      skipEmptyLines: true,
      encoding: encoding,
      chunk: function(results) {
        meta = results.meta;
        [].push.apply(data, results.data);
        [].push.apply(errors, results.errors);
      },
      complete: function(results) {
        results = {
          data: data,
          errors: errors,
          meta: meta
        };
        var error = getPapaParseError(results.errors);
        if (error) {
          reject(error);
        } else {
          var records = results.data;
          var headers = _.first(records);
          var rows = _.slice(records, 1);
          var schema = jts.infer(headers, rows);
          var delimiter = results.meta.delimiter;
          var linebreak = results.meta.linebreak;
          var raw = csv.unparse(records, {
            quotes: true,
            delimiter: ',',
            newline: '\r\n'
          });
          resolve({
            raw: raw,
            headers: headers,
            rows: rows,
            schema: schema,
            dialect: {
              delimiter: delimiter,
              linebreak: linebreak
            }
          });
        }
      }
    };
    csv.parse(_.isObject(urlOrFile) ? urlOrFile.blob :
      decorateProxyUrl(urlOrFile), config);
  });
}

function validateData(data, dataUrl, schema, userEndpointURL) {
  var goodTables = new GoodTables({
    method: 'post',
    report_type: 'grouped'
  }, userEndpointURL);

  return goodTables.run(
    data, !!schema ? JSON.stringify(schema) : undefined, dataUrl)
    .then(function(results) {
      if (!results) {
        return false;
      }
      var grouped = results.getGroupedByRows();
      var headers = results.getHeaders();
      var encoding = results.getEncoding();
      return {
        headers: headers,
        encoding: encoding,
        errors: _.map(grouped, function(item) {
          return _.extend(_.values(item)[0], {
            headers: headers
          });
        })
      };
    });
}

function getDefaultCurrency() {
  var currencies = module.exports.availableCurrencies;
  var defaultCurrencies = _.intersection(
    ['USD', 'EUR', _.first(currencies).code],
    _.map(currencies, function(item) {
      return item.code;
    }));
  var defaultCurrencyCode = _.first(defaultCurrencies);
  return _.find(currencies, function(item) {
    return item.code == defaultCurrencyCode;
  });
}

function setAvailableCurrencies(currencies) {
  var temp = module.exports.availableCurrencies;
  temp.splice(0, temp.length);
  if (_.isArray(currencies)) {
    [].push.apply(temp, currencies);
  }
}

function createNameFromPath(fileName) {
  var result = path.basename(fileName, path.extname(fileName));
  return convertToSlug(result || fileName);
}

function createNameFromUrl(urlOfResource) {
  var result = url.parse(urlOfResource);
  if (result && result.pathname) {
    return createNameFromPath(result.pathname);
  }
  return urlOfResource;
}

function createUniqueName(desiredName, availableNames) {
  var isItemFound = !!_.find(availableNames, function(item) {
    return item == desiredName;
  });
  if (!isItemFound) {
    return desiredName;
  }
  desiredName += '-';
  var mapped = _.map(availableNames, function(item) {
    if (item.indexOf(desiredName) == 0) {
      var rest = item.substr(desiredName.length);
      if (rest.match(/^[0-9]$/g)) {
        return parseInt(rest);
      }
    }
    return 0;
  });
  mapped.push(0);
  return desiredName + (_.max(mapped) + 1);
}

function addItemWithUniqueName(collection, item) {
  item.name = createUniqueName(item.name,
    _.map(collection, function(item) {
      return item.name;
    }));
  collection.push(item);
}

function removeEmptyAttributes(object) {
  return _.pickBy(object, function(value) {
    return !!value;
  });
}

function blobToFileDescriptor(blob) {
  if ((typeof Blob == 'undefined') || !_.isFunction(Blob) ||
    !(blob instanceof Blob)) {
    return Promise.resolve(blob);
  }

  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.addEventListener('load', function(event) {
      resolve({
        name: blob.name,
        type: blob.type,
        size: blob.size,
        data: reader.result,
        blob: blob
      });
    });
    reader.addEventListener('error', function() {
      reject(reader.error);
    });
    var slice = blob.slice || blob.webkitSlice || blob.mozSlice;
    reader.readAsArrayBuffer(slice.call(blob, 0, 1024 * 1024));
  });
}

module.exports.availableCurrencies = [];
module.exports.availableConcepts = (function() {
  return [
    {
      name: '',
      id: '',
      group: null,
      required: false
    },
    {
      osType: 'value',
      id: 'measures.amount',
      group: 'measure',
      required: true,
      options: [
        {
          name: 'currency',
          title: 'Currency',
          defaultValue: null,
          values: []
        },
        {
          name: 'factor',
          title: 'Factor',
          defaultValue: '',
          type: 'number'
        },
        {
          name: 'direction',
          title: 'Direction',
          defaultValue: '',
          values: [
            {name: '', value: ''},
            {name: 'Expenditure', value: 'expenditure'},
            {name: 'Revenue', value: 'revenue'}
          ]
        },
        {
          name: 'phase',
          title: 'Phase',
          defaultValue: '',
          values: [
            {name: '', value: ''},
            {name: 'Proposed', value: 'proposed'},
            {name: 'Approved', value: 'approved'},
            {name: 'Adjusted', value: 'adjusted'},
            {name: 'Executed', value: 'executed'}
          ]
        }
      ]
    }
  ];
})();
setAvailableCurrencies(require('../data/iso4217.json'));

module.exports.isUrl = isUrl;
module.exports.decorateProxyUrl = decorateProxyUrl;
module.exports.convertToSlug = convertToSlug;
module.exports.getCsvSchema = getCsvSchema;
module.exports.validateData = validateData;
module.exports.getDefaultCurrency = getDefaultCurrency;
module.exports.setAvailableCurrencies = setAvailableCurrencies;
module.exports.createNameFromPath = createNameFromPath;
module.exports.createNameFromUrl = createNameFromUrl;
module.exports.createUniqueName = createUniqueName;
module.exports.addItemWithUniqueName = addItemWithUniqueName;
module.exports.removeEmptyAttributes = removeEmptyAttributes;
module.exports.blobToFileDescriptor = blobToFileDescriptor;
