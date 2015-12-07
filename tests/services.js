'use strict';

var _ = require('underscore');
var assert = require('chai').assert;
var utils = require('../app/services/utils');
var Package = require('../app/services/package');

// Make PapaParse working (do not remove this line!)
var testUtils = require('./utils');

var exampleResourceUrl = 'https://raw.githubusercontent.com/okfn/goodtables/' +
  'master/examples/valid.csv';

describe('Application services', function() {
  this.timeout(20000);

  describe('Utils', function() {

    it('Should create name from path', function(done) {
      var tests = [
        ['example.csv', 'example'],
        ['example.test.csv', 'example-test'],
        ['example', 'example'],
        ['перевірка.csv', 'perevirka'],
        ['перевірка', 'perevirka']
      ];
      _.each(tests, function(test) {
        assert.equal(utils.createNameFromPath(test[0]), test[1]);
      });
      done();
    });

    it('Should create name from url', function(done) {
      var tests = [
        // Full URL
        ['http://example.com/example.csv', 'example'],
        ['http://example.com/skip/example.csv', 'example'],
        ['http://example.com/skip/example.csv?a=123', 'example'],
        ['http://example.com/skip/example.csv#anchor', 'example'],
        ['http://example.com/example.test.csv', 'example-test'],
        ['http://example.com/example', 'example'],
        ['http://example.com/перевірка.csv', 'perevirka'],
        ['http://example.com/перевірка', 'perevirka'],

        // Partial URL
        ['/skip/example.csv', 'example'],
        ['/skip/example.test.csv', 'example-test'],
        ['/skip/example', 'example'],
        ['/skip/перевірка.csv', 'perevirka'],
        ['/skip/перевірка', 'perevirka'],

        // Proxy
        ['/proxy?url=http%3A%2F%2Fexample.com%2Fexample.csv', 'example'],
        ['/proxy?url=http%3A%2F%2Fexample.com%2Fskip%2Fexample.csv', 'example'],
        ['/proxy?url=%2Fskip%2Fexample.csv', 'example']
      ];
      _.each(tests, function(test) {
        assert.equal(utils.createNameFromUrl(test[0]), test[1]);
      });
      done();
    });

    it('Should create title from name', function(done) {
      var tests = [
        ['simple', 'Simple'],
        ['few words', 'Few Words'],
        ['with. some-punctuation: example', 'With. Some Punctuation: Example'],
        ['кирилиця', 'кирилиця']
      ];
      _.each(tests, function(test) {
        assert.equal(utils.convertToTitle(test[0]), test[1]);
      });
      done();
    });

    it('Should convert string to slug', function(done) {
      var tests = [
        ['Simple', 'simple'],
        ['few words With DIFFERENT case', 'few-words-with-different-case'],
        ['кирилиця', 'kyrylytsja'],
        ['with.lot!!of+punctuation', 'with-lot-of-punctuation'],
        ['mixed charset перевірка', 'mixed-charset-perevirka']
      ];
      _.each(tests, function(test) {
        assert.equal(utils.convertToSlug(test[0]), test[1]);
      });
      done();
    });

    it('Should create unique name', function(done) {
      var tests = [
        ['test', [], 'test'],
        ['test', ['qwerty'], 'test'],
        ['test', ['qwerty', 'test'], 'test-1'],
        [
          'test',
          ['qwerty', 'test', 'test-1', 'test-5', 'test-a', 'test-6a'],
          'test-6'
        ]
      ];
      _.each(tests, function(test) {
        assert.equal(utils.createUniqueName(test[0], test[1]), test[2]);
      });
      done();
    });

  });

  describe('Package', function() {

    it('Should create resource from URL', function(done) {
      var dataPackage = new Package();
      dataPackage.resources.createFromSource(exampleResourceUrl)
        .then(function(resource) {
          assert.equal(resource.name, 'valid');
          assert.equal(resource.title, 'Valid');

          assert.property(resource, 'source');
          assert.equal(resource.source.url, exampleResourceUrl);

          assert.property(resource, 'data');
          assert.property(resource.data, 'headers');
          assert.property(resource.data, 'rows');
          assert.property(resource.data, 'raw');

          assert.property(resource, 'fields');

          done();
        })
        .catch(console.trace.bind(console));
    });

    it('Should add resource with unique name', function(done) {
      var dataPackage = new Package();
      var resource = {
        name: 'example',
        title: 'Example resource'
      };
      dataPackage.resources.add(_.clone(resource));
      dataPackage.resources.add(_.clone(resource));
      dataPackage.resources.add(_.clone(resource));

      assert.equal(dataPackage.resources.length, 3);

      assert.equal(dataPackage.resources[0].name, 'example');
      assert.equal(dataPackage.resources[0].title, 'Example resource');

      assert.equal(dataPackage.resources[1].name, 'example-1');
      assert.equal(dataPackage.resources[1].title, 'Example resource');

      assert.equal(dataPackage.resources[2].name, 'example-2');
      assert.equal(dataPackage.resources[2].title, 'Example resource');

      done();
    });

    it('Should create Fiscal Data Package', function(done) {
      var dataPackage = new Package();
      dataPackage.resources.createFromSource(exampleResourceUrl)
        .then(function(resource) {
          dataPackage.attributes.name = 'example';
          dataPackage.attributes.title = 'Example Data Package';

          resource.fields[0].concept = 'measures.amount';
          resource.fields[1].concept = 'dimensions.datetime';
          dataPackage.resources.add(resource);

          var fiscalPackage = dataPackage.createFiscalDataPackage();

          assert.deepEqual(fiscalPackage,
            require('./data/example-package.json'));

          done();
        })
        .catch(console.trace.bind(console));
    });

  });

});
