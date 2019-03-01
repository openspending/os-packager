'use strict';

var assert = require('chai').assert;
var utils = require('./utils');

var exampleResourceUrl = 'https://raw.githubusercontent.com/openspending/' +
  'os-packager/master/tests/data/example-resource.csv';
var dataPackageTitle = 'Test Перевірка';
var dataPackageSlug = 'test-perevirka';
var BASE_URL = 'http://localhost:5000';

describe('Wizard UI', function() {
  this.timeout(60000);

  before(utils.app.start);
  after(utils.app.shutdown);

  it('Should open app page', function(done) {
    var browser = utils.app.browser;
    browser.visit(BASE_URL + '/provide-data', function() {
      assert.ok(browser.success);
      browser.waitForDigest('#step1-wrapper', 100)
        .then(function() {
          assert(browser.query('#step1-wrapper'), 'It should be step #1');
          done();
        })
        .catch(done);
    });
  });

  it('Should create resource from URL', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step1-wrapper'), 'It should be step #1');

    assert(browser.evaluate('$("#step1-input-url").val()') == '',
      'Url input should be empty on page load');
    assert(browser.evaluate('$("#step1-input-file").val()') == '',
      'File input should be empty on page load');

    browser.fill('#step1-input-url', exampleResourceUrl);
    browser.waitForDigest('#step1-button-next')
      .then(function() {
        assert(browser.query('#step1-button-next'),
          'Next button should be available');
        browser.click('#step1-button-next');
        return browser.waitForDigest('#step2-wrapper');
      })
      .then(function() {
        assert(browser.query('#step2-wrapper'), 'It should be step #2');
        done();
      })
      .catch(done);
  });

  it('Should map required concepts', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step2-wrapper'), 'It should be step #2');

    browser.evaluate('$("#step2-wrapper textarea.typeahead:eq(1)")' +
      '.trigger("typeahead:select",{leaf:true, val:"date:generic"});');
    browser.evaluate('$("#step2-wrapper textarea.typeahead:eq(3)")' +
      '.trigger("typeahead:select",{leaf:true, val:"value"});');

    browser.waitForDigest('#step2-button-next').then(function() {
      assert(browser.query('#step2-button-next'),
        'Next button should be available');
      browser.click('#step2-button-next');
      return browser.waitForDigest('#step3-wrapper');
    })
    .then(function() {
      assert(browser.query('#step3-wrapper'), 'It should be step #3');
      done();
    })
    .catch(done);
  });

  it('Should fill metadata', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step3-wrapper'), 'It should be step #3');
    browser.fill('title', dataPackageTitle);
    browser.fill('name', dataPackageSlug);
    browser.waitForDigest('#step3-location-country[disabled]')
      .then(function() {
        // Initially Region is enabled and Country and City is disabled
        assert(browser.query('#step3-location-region:not([disabled])'),
          'Region input should be enabled');
        assert(browser.query('#step3-location-country[disabled]'),
          'Country input should be disabled');
        assert(browser.query('#step3-location-city[disabled]'),
          'City input should be disabled');

        // Fill Region
        browser.evaluate('$("#step3-location-region")' +
          '.val("string:eu").change();');
        return browser.waitForDigest('#step3-location-country:not([disabled])');
      })
      .then(function() {
        // When region is filled in, Country should be enabled and City
        // should still disabled
        assert(browser.query('#step3-location-region:not([disabled])'),
          'Region input should be enabled');
        assert(browser.query('#step3-location-country:not([disabled])'),
          'Country input should be enabled');
        assert(browser.query('#step3-location-city[disabled]'),
          'City input should be disabled');

        // Fill Country
        browser.evaluate('$("#step3-location-country")' +
          '.val("string:GB").change();');

        return browser.waitForDigest('#step3-location-city:not([disabled])');
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
        return browser.waitForDigest('#step3-button-next');
      })
      .then(function() {
        assert(browser.query('#step3-button-next'),
          'Next button should be available');
        browser.click('#step3-button-next');
        return browser.waitForDigest('#step4-wrapper');
      })
      .then(function() {
        assert(browser.query('#step4-wrapper'), 'It should be step #4');
        done();
      })
      .catch(done);
  });

  it('Should allow to download package', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step4-wrapper'), 'It should be step #4');
    browser.waitForDigest('#step4-button-download')
      .then(function() {
        // Button removed: openspending/openspending/issues/988
        // assert(browser.query('#step4-button-download'),
        //   'Download button should be available');
        assert(browser.query('#step4-button-cant-publish'),
          'Publish button should be available');
        var dataPackage = browser.evaluate('$("[name=data]").val();');
        dataPackage = JSON.parse(dataPackage);
        assert.equal(dataPackage.title, dataPackageTitle);
        assert.equal(dataPackage.name, dataPackageSlug);
        assert.property(dataPackage, 'resources');
        assert.equal(dataPackage.resources.length, 1);
        assert.property(dataPackage, 'model');
        assert.property(dataPackage.model, 'measures');
        assert.property(dataPackage.model, 'dimensions');
        done();
      })
      .catch(done);
  });

  it('Should go to first step', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step4-wrapper'), 'It should be step #4');
    // Link #0 is a Restart Flow button
    browser.evaluate('$(".x-steps-container a:eq(0)").click();');
    browser.waitForDigest('#step1-wrapper')
      .then(function() {
        assert(browser.query('#step1-wrapper'), 'It should be step #1');
        done();
      })
      .catch(done);
  });
});
