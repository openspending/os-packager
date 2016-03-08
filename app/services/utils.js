'use strict';

var _ = require('underscore');
var GoodTables = require('goodtables');
var Promise = require('bluebird');
var csv = require('papaparse');
var jts = require('json-table-schema');
var inflector = require('inflected');
var path = require('path');
var url = require('url');
var validator = require('validator');

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

module.exports.isUrl = function(url) {
  return validator.isURL(url);
};

module.exports.undecorateProxyUrl = function(urlToUndecorate) {
  var result = url.parse(urlToUndecorate, true);
  if (result && result.pathname) {
    if ((result.pathname == 'proxy') && result.query && result.query.url) {
      return result.query.url;
    }
  }
  return urlToUndecorate;
};

module.exports.decorateProxyUrl = function(urlToDecorate) {
  return 'proxy?url=' + encodeURIComponent(
    module.exports.undecorateProxyUrl(urlToDecorate));
};

module.exports.convertToTitle = function(string) {
  return inflector.titleize('' + (string || ''));
};

module.exports.convertToSlug = function(string) {
  var ret=inflector.parameterize(inflector.transliterate('' + (string || '')));
  if ( ret === '' ) {
    return 'slug';
  }
  return ret;
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
        var delimiter = results.meta.delimiter;
        var linebreak = results.meta.linebreak;
        resolve({
          raw: csv.unparse(results.data, {
            quotes: true,
            delimiter: ',',
            newline: '\r\n'
          }),
          headers: headers,
          rows: rows,
          schema: schema,
          dialect: {
            delimiter: delimiter,
            linebreak: linebreak
          }
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

module.exports.availableDataTypes = (function() {
  return _.chain(jts.types)
    .filter(function(item, key) {
      return (key != 'JSType') && (key.substr(-4) == 'Type');
    })
    .map(function(TypeConstructor) {
      var result = new TypeConstructor();
      result.id = result.name;
      return result;
    })
    .value();
})();

module.exports.availableCurrencies = [];

module.exports.getDefaultCurrency = function() {
  var currencies = module.exports.availableCurrencies;
  var defaultCurrencies = _.intersection(
    ['USD', 'EUR', _.first(currencies).code],
    _.pluck(currencies, 'code'));
  var defaultCurrencyCode = _.first(defaultCurrencies);
  return _.find(currencies, function(item) {
    return item.code == defaultCurrencyCode;
  });
};

module.exports.availableConcepts = (function() {
  var allTypes = _.pluck(module.exports.availableDataTypes, 'id');
  var idTypes = ['integer', 'number', 'string'];
  return [
    {
      name: '',
      id: '',
      allowedTypes: allTypes,
      group: null,
      required: false,
      dimensionType: 'other'
    },
    {
      name: 'Amount',
      id: 'measures.amount',
      allowedTypes: ['number', 'integer'],
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
          pattern: /^[+-]?[0-9]+(\.[0-9]+)?$/
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
      ],
      dimensionType: 'amount'
    },
    {
      name: 'Date / Time',
      id: 'dimensions.datetime',
      allowedTypes: ['datetime', 'date', 'time', 'integer', 'numeric'],
      group: 'dimension',
      required: true,
      dimensionType: 'datetime'
    },
    {
      name: 'Entity',
      id: 'dimensions.entity',
      allowedTypes: idTypes,
      group: 'dimension',
      required: false,
      dimensionType: 'entity'
    },
    {
      name: 'Classification',
      id: 'dimensions.classification',
      allowedTypes: idTypes,
      group: 'dimension',
      required: false,
      options: [
        {
          name: 'classificationType',
          title: 'Classification type',
          defaultValue: '',
          values: [
            {name: '', value: ''},
            {name: 'Functional', value: 'functional'},
            {name: 'Administrative', value: 'administrative'},
            {name: 'Economic', value: 'economic'}
          ]
        }
      ],
      dimensionType: 'classification'
    },
    {
      name: 'Activity',
      id: 'dimensions.activity',
      allowedTypes: idTypes,
      group: 'dimension',
      required: false,
      dimensionType: 'activity'
    },
    {
      name: 'Location',
      id: 'dimensions.location',
      allowedTypes: idTypes,
      group: 'dimension',
      required: false,
      dimensionType: 'location'
    }
  ];
})();

module.exports.availablePossibilities = (function() {
  var updateByConcepts = function(resources) {
    if (!this || !_.isArray(this.concepts)) {
      return;
    }

    var conceptsToCheck = _.chain(this.concepts)
      .map(function(concept) {
        return [concept, false];
      })
      .object()
      .value();

    var self = this;
    _.each(resources, function(resource) {
      _.each(resource.fields, function(field) {
        if (_.contains(self.concepts, field.concept)) {
          conceptsToCheck[field.concept] = true;
        }
      });
    });

    this.isAvailable = !_.contains(conceptsToCheck, false);
  };

  return [
    {
      id: 'transaction-table',
      name: 'Transaction Table',
      isAvailable: false,
      concepts: ['measures.amount'],
      graph: 'pie',
      update: updateByConcepts
    },
    {
      id: 'time-series',
      name: 'Time series',
      isAvailable: false,
      graph: 'lines',
      concepts: ['measures.amount', 'dimensions.datetime'],
      update: updateByConcepts
    },
    {
      id: 'treemap',
      name: 'Treemap',
      isAvailable: false,
      graph: 'treemap',
      concepts: ['measures.amount', 'dimensions.classification'],
      update: updateByConcepts
    },
    {
      id: 'classification',
      name: 'Classification explorer',
      isAvailable: false,
      graph: 'treemap',
      concepts: ['measures.amount', 'dimensions.classification'],
      update: updateByConcepts
    },
    {
      id: 'mutlidimension',
      name: 'Multiple dimension agg',
      isAvailable: false,
      graph: 'treemap',
      concepts: ['measures.amount'],
      update: function(resources) {
        updateByConcepts.call(this, resources);
        if (this.isAvailable) {
          var countOfDimensions = 0;
          _.each(resources, function(resource) {
            _.each(resource.fields, function(field) {
              var concept = _.findWhere(module.exports.availableConcepts, {
                id: field.concept
              });
              if (concept && (concept.group == 'dimension')) {
                countOfDimensions += 1;
              }
            });
          });
          // There should be at least one measure and more than one dimension
          if (countOfDimensions < 2) {
            this.isAvailable = false;
          }
        }
      }
    }
  ];
})();

module.exports.setAvailableCurrencies = function(currencies) {
  var temp = module.exports.availableCurrencies;
  temp.splice(0, temp.length);
  if (_.isArray(currencies)) {
    [].push.apply(temp, currencies);
  }

  var concept = _.findWhere(module.exports.availableConcepts, {
    id: 'measures.amount'
  });
  if (concept) {
    var option = _.findWhere(concept.options, {name: 'currency'});
    if (option) {
      option.values = _.map(module.exports.availableCurrencies,
        function(item) {
          return {
            name: item.code + ' ' + item.name,
            value: item.code
          };
        });

      option.defaultValue = module.exports.getDefaultCurrency().code;
    }
  }
};

module.exports.setAvailableCurrencies(require('../data/iso4217.json'));

module.exports.createNameFromPath = function(fileName) {
  var result = path.basename(fileName, path.extname(fileName));
  return module.exports.convertToSlug(result || fileName);
};

module.exports.createNameFromUrl = function(urlOfResource) {
  var result = url.parse(module.exports.undecorateProxyUrl(urlOfResource));
  if (result && result.pathname) {
    return module.exports.createNameFromPath(result.pathname);
  }
  return urlOfResource;
};

module.exports.getAllowedTypesForValues = function(values, additionalTypes) {
  var result = [];
  if (_.isArray(values)) {
    result = _.map(values, function(value) {
      return module.exports.getAllowedTypesForValues(value, additionalTypes);
    });
    return _.intersection.apply(_, result);
  } else {
    result = {};
    _.each(module.exports.availableDataTypes, function(type) {
      if (type.cast(values)) {
        result[type.id] = type;
      } else
      if (_.isArray(additionalTypes) && _.contains(additionalTypes, type.id)) {
        result[type.id] = type;
      } else
      if (!!additionalTypes && (type.id == additionalTypes)) {
        result[type.id] = type;
      }
    });
    return _.values(result);
  }
};

module.exports.getAllowedConcepts = function(types) {
  types = _.isArray(types) ? _.pluck(types, 'id') : [types.id];
  return _.filter(module.exports.availableConcepts, function(concept) {
    if (_.isArray(concept.allowedTypes)) {
      return _.intersection(concept.allowedTypes, types).length > 0;
    }
    return false;
  });
};

module.exports.createUniqueName = function(desiredName, availableNames) {
  if (!_.contains(availableNames, desiredName)) {
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
};

module.exports.addItemWithUniqueName = function(collection, item) {
  item.name = module.exports.createUniqueName(item.name,
    _.pluck(collection, 'name'));
  collection.push(item);
};

module.exports.removeEmptyAttributes = function(object) {
  return _.pick(object, function(value) {
    return !!value;
  });
};

module.exports.getDataForPreview = function(resources, maxCount) {
  if (!_.isArray(resources) || (resources.length < 1)) {
    return [];
  }

  var amountFieldIndex = null;
  var dateTimeFieldIndex = null;
  var dimensionFieldIndex = null;

  var resource = _.first(resources);
  _.each(resource.fields, function(field, index) {
    switch (field.concept) {
      case 'measures.amount': amountFieldIndex = index; break;
      case 'dimensions.datetime': dateTimeFieldIndex = index; break;
      case 'dimensions.entity': dimensionFieldIndex = index; break;
      case 'dimensions.classification': dimensionFieldIndex = index; break;
      case 'dimensions.activity': dimensionFieldIndex = index; break;
      case 'dimensions.location': dimensionFieldIndex = index; break;
    }
  });

  if (amountFieldIndex === null) {
    return [];
  }

  if (dimensionFieldIndex === null) {
    dimensionFieldIndex = dateTimeFieldIndex;
  }
  if (dimensionFieldIndex === null) {
    dimensionFieldIndex = amountFieldIndex;
  }

  var rows = resource.data.rows;
  maxCount = parseFloat(maxCount);
  if (isFinite(maxCount)) {
    rows = rows.slice(0, maxCount);
  }

  return _.map(rows, function(row) {
    var result = {};
    result.value = row[amountFieldIndex];
    if (dateTimeFieldIndex !== null) {
      result.dateTime = row[dateTimeFieldIndex];
    }
    if (dimensionFieldIndex !== null) {
      result.name = row[dimensionFieldIndex];
    }

    return result;
  });
};

module.exports.blobToFileDescriptor = function(blob) {
  if ((typeof Blob == 'undefined') || !_.isFunction(Blob) ||
    !(blob instanceof Blob)) {
    return Promise.resolve(blob);
  }
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.addEventListener('loadend', function() {
      resolve({
        name: blob.name,
        type: blob.type,
        size: reader.result.length,
        data: reader.result
      });
    });
    reader.addEventListener('error', function() {
      reject(reader.error);
    });
    reader.readAsText(blob);
  });
};

module.exports.fileDescriptorToBlob = function(descriptor) {
  var result = descriptor;
  if (_.isObject(descriptor) && _.isFunction(Blob)) {
    result = new Blob([descriptor.data], {
      type: descriptor.type
    });
    result.name = descriptor.name;
  }
  return Promise.resolve(result);
};
