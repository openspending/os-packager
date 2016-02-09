'use strict';

var assert = require('chai').assert;
var config = require('../app/config');
var utils = require('./utils');

var exampleResourceUrl = 'http://localhost:' + config.get('app:port') +
  '/example-resource.csv';
var dataPackageTitle = 'Test Перевірка';
var dataPackageSlug = 'test-perevirka';

describe('Wizard UI', function() {
  this.timeout(20000);

  before(utils.app.start);
  after(utils.app.shutdown);

  it('Should open app page', function(done) {
    var browser = utils.app.browser;
    browser.visit('/', function() {
      browser.waitForDigest().then(function() {
        assert.ok(browser.success);
        done();
      });
    });
  });

  it('Should create resource from URL', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step1-wrapper'), 'It should be step #1');

    assert(browser.evaluate('$("#step1-input-url").val()') == '',
      'Url input should be empty on page load');
    assert(browser.evaluate('$("#step1-input-file").val()') == '',
      'File input should be empty on page load');

    browser.fill('step1-resource-url', exampleResourceUrl);
    browser.waitForDigest().then(function() {
      assert(browser.query('#step1-button-next'),
        'Next button should be available');
      browser.click('#step1-button-next');
      browser.waitForDigest().then(function() {
        assert(browser.query('#step2-wrapper'), 'It should be step #2');
        done();
      });
    });
  });

  it('Should map required concepts', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step2-wrapper'), 'It should be step #2');

    browser.evaluate('$("#step2-concept-0")' +
      '.val("string:dimensions.datetime").change();');
    browser.evaluate('$("#step2-concept-1")' +
      '.val("string:measures.amount").change();');

    browser.waitForDigest().then(function() {
      assert(browser.query('#step2-button-next'),
        'Next button should be available');

      assert(browser.query('#preview-data-panel button:not(disabled)'),
        'Some previews should be available');

      browser.click('#step2-button-next');
      browser.waitForDigest().then(function() {
        assert(browser.query('#step3-wrapper'), 'It should be step #3');
        done();
      });
    });
  });

  it('Should fill metadata', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step3-wrapper'), 'It should be step #3');
    browser.fill('title', dataPackageTitle);
    browser.waitForDigest()
      .then(function() {
        // Initially Region is enabled and Country and City is disabled
        assert(!browser.query('#step3-location-region[disabled]'),
          'Region input should be enabled');
        assert(browser.query('#step3-location-country[disabled]'),
          'Country input should be disabled');
        assert(browser.query('#step3-location-city[disabled]'),
          'City input should be disabled');

        // Fill Region
        browser.evaluate('$("#step3-location-region")' +
          '.val("string:eu").change();');
        return browser.waitForDigest();
      })
      .then(function() {
        // When region is filled in, Country should be enabled and City
        // should still disabled
        assert(!browser.query('#step3-location-region[disabled]'),
          'Region input should be enabled');
        assert(!browser.query('#step3-location-country[disabled]'),
          'Country input should be enabled');
        assert(browser.query('#step3-location-city[disabled]'),
          'City input should be disabled');

        // Fill Country
        browser.evaluate('$("#step3-location-country")' +
          '.val("string:GB").change();');
        return browser.waitForDigest(10);
      })
      .then(function() {
        // And when Region and Country are filled in, all three fields should
        // be enabled
        assert(!browser.query('#step3-location-region[disabled]'),
          'Region input should be enabled');
        assert(!browser.query('#step3-location-country[disabled]'),
          'Country input should be enabled');
        assert(!browser.query('#step3-location-city[disabled]'),
          'City input should be enabled');
      })
      .then(function() {
        assert(browser.query('#step3-button-next'),
          'Next button should be available');
        browser.click('#step3-button-next');
        return browser.waitForDigest();
      })
      .then(function() {
        assert(browser.query('#step4-wrapper'), 'It should be step #4');
        done();
      });
  });

  it('Should allow to download package', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step4-wrapper'), 'It should be step #4');
    browser.waitForDigest().then(function() {
      assert(browser.query('#step4-button-download'),
        'Download button should be available');
      assert(browser.query('#step4-button-publish'),
        'Publish button should be available');
      var dataPackage = browser.evaluate('$("[name=data]").val();');
      dataPackage = JSON.parse(dataPackage);
      assert.equal(dataPackage.title, dataPackageTitle);
      assert.equal(dataPackage.name, dataPackageSlug);
      assert.property(dataPackage, 'resources');
      assert.equal(dataPackage.resources.length, 1);
      assert.property(dataPackage, 'mapping');
      assert.property(dataPackage.mapping, 'measures');
      assert.property(dataPackage.mapping, 'dimensions');
      done();
    });
  });

  it('Should go to first step', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step4-wrapper'), 'It should be step #4');
    browser.evaluate('$("#steps-nav li a:eq(0)").click();');
    browser.waitForDigest().then(function() {
      assert(browser.query('#step1-wrapper'), 'It should be step #1');
      done();
    });
  });

});
