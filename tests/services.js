'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var utils = require('../app/services/utils');
var dataPackage = require('../app/services/package');
var dataStore = require('../app/services/os-datastore');

// Make PapaParse working (do not remove this line!)
var testUtils = require('./utils');

var exampleResourceUrl = 'https://raw.githubusercontent.com/openspending/' +
  'os-packager/master/tests/data/example-resource.csv';

describe('Application services', function() {
  this.timeout(20000);

  describe('Utils', function() {

    it('Should create name from path', function(done) {
      var tests = [
        ['example.csv', 'example'],
        ['example.test.csv', 'example-test'],
        ['example', 'example'],
        ['перевірка.csv', 'slug'],
        ['перевірка', 'slug']
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
        ['http://example.com/перевірка.csv', 'slug'],
        ['http://example.com/перевірка', 'slug'],

        // Partial URL
        ['/skip/example.csv', 'example'],
        ['/skip/example.test.csv', 'example-test'],
        ['/skip/example', 'example'],
        ['/skip/перевірка.csv', 'slug'],
        ['/skip/перевірка', 'slug']
      ];
      _.each(tests, function(test) {
        assert.equal(utils.createNameFromUrl(test[0]), test[1]);
      });
      done();
    });

    //it('Should create title from name', function(done) {
    //  var tests = [
    //    ['simple', 'Simple'],
    //    ['few words', 'Few Words'],
    //   ['with. some-punctuation: example', 'With. Some Punctuation: Example'],
    //    ['кирилиця', 'кирилиця']
    //  ];
    //  _.each(tests, function(test) {
    //    assert.equal(utils.convertToTitle(test[0]), test[1]);
    //  });
    //  done();
    //});

    it('Should convert string to slug', function(done) {
      var tests = [
        ['Simple', 'simple'],
        ['few words With DIFFERENT case', 'few-words-with-different-case'],
        ['кирилиця', 'slug'],
        ['with.lot!!of+punctuation', 'with-lot-of-punctuation'],
        ['mixed charset перевірка', 'mixed-charset']
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

    it('Should add item with unique name', function(done) {
      var item = {
        name: 'example',
        title: 'Example resource'
      };
      var collection = [];
      utils.addItemWithUniqueName(collection, _.clone(item));
      utils.addItemWithUniqueName(collection, _.clone(item));
      utils.addItemWithUniqueName(collection, _.clone(item));

      assert.equal(collection.length, 3);

      assert.equal(collection[0].name, 'example');
      assert.equal(collection[0].title, 'Example resource');

      assert.equal(collection[1].name, 'example-1');
      assert.equal(collection[1].title, 'Example resource');

      assert.equal(collection[2].name, 'example-2');
      assert.equal(collection[2].title, 'Example resource');

      done();
    });

  });

  describe('Package', function() {

    it('Should create resource from URL', function(done) {
      dataPackage.createResourceFromSource(exampleResourceUrl)
        .then(function(resource) {
          assert.equal(resource.name, 'example-resource');
          assert.equal(resource.title, 'example-resource');

          assert.property(resource, 'source');
          assert.equal(resource.source.url, exampleResourceUrl);

          assert.property(resource, 'data');
          assert.property(resource.data, 'headers');
          assert.property(resource.data, 'rows');
          assert.property(resource.data, 'raw');

          assert.property(resource, 'fields');

          done();
        })
        .catch(done);
    });

    it('Should create Fiscal Data Package', function(done) {
      var resources = [];
      var attributes = {
        name: 'example',
        title: 'Example Data Package'
      };
      dataPackage.createResourceFromSource(exampleResourceUrl)
        .then(function(resource) {
          resource.fields[0].type = 'date:generic';
          resource.fields[1].type = 'value';
          resource.fields[0].resource = 'example-resource';
          resource.fields[1].resource = 'example-resource';
          utils.addItemWithUniqueName(resources, resource);

          var fiscalPackage = dataPackage.createFiscalDataPackage(attributes,
            resources);

          assert.deepEqual(fiscalPackage,
            require('./data/example-package.json'));

          done();
        })
        .catch(done);
    });

    //TODO: [Adam] Removed until functionality is restored
    //it('Should prepare data for preview', function(done) {
    //  dataPackage.createResourceFromSource(exampleResourceUrl)
    //    .then(function(resource) {
    //      resource.fields[0].concept = 'measures.amount';
    //      resource.fields[1].concept = 'dimensions.classification';
    //
    //      var data = utils.getDataForPreview([resource], 5);
    //
    //      assert.isAbove(data.length, 0);
    //      assert.isBelow(data.length, 6);
    //
    //      assert.equal(data[0].value, resource.data.rows[0][0]);
    //      assert.equal(data[0].name, resource.data.rows[0][1]);
    //
    //      done();
    //    })
    //    .catch(done);
    //});

    it('Should validate Fiscal Data Package', function(done) {
      var resources = [];
      var attributes = {
        name: 'example',
        title: 'Example Data Package'
      };
      dataPackage.createResourceFromSource(exampleResourceUrl)
        .then(function(resource) {
          resource.fields[0].type = 'value';
          resource.fields[0].options = {
            currency: 'USD'
          };
          resource.fields[1].type = 'date:generic';
          utils.addItemWithUniqueName(resources, resource);

          var fiscalPackage = dataPackage.createFiscalDataPackage(attributes,
            resources);

          var schema = dataPackage.getFiscalDataPackageSchema(false);
          return dataPackage.validateDataPackage(fiscalPackage, schema);
        })
        .then(function(results) {
          assert(results.valid, 'It should be valid');
          done();
        })
        .catch(done);
    });

  });

  describe.skip('OS DataStore', function() {
    // OS DataStore tests skipped until we find a way to run them
    // from node

    dataStore.disableXhr = true;

    it('Should read file contents', function(done) {
      var file = {
        name: 'test.csv',
        url: exampleResourceUrl
      };
      dataStore.readContents(file)
        .then(function(data) {
          assert.notEqual(data, '');
          done();
        })
        .catch(done);
    });

    it('Should upload file to data store', function(done) {
      var file = {
        name: 'test.csv',
        blob: new Blob(['Hello,1,test'], {type: 'application/octet-stream'})
      };
      var options = {
        name: 'test.csv',
        owner: '__tests',
        // jscs:disable
        permission_token: 'testing-token'
        // jscs:enable
      };
      dataStore.prepareForUpload(file, options)
        .then(function() {
          assert.property(file, 'uploadUrl');
          assert.property(file, 'uploadParams');
          return dataStore.upload(file);
        })
        .then(function() {
          assert.equal(file.status, dataStore.ProcessingStatus.UPLOADING);
          assert.equal(file.progress, 1.0, 'File should be uploaded');
          done();
        })
        .catch(done);
    });

  });

});
