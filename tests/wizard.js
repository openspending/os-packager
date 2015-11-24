'use strict';

var assert = require('chai').assert;
var utils = require('./utils');

var exampleResourceUrl = 'https://raw.githubusercontent.com/okfn/goodtables/' +
  'master/examples/valid.csv';
var dataPackageTitle = 'Test Перевірка';
var dataPackageSlug = 'test-perevirka';

describe('Wizard UI', function() {
  this.timeout(20000);

  before(utils.app.start);
  after(utils.app.shutdown);

  it('Should open app page', function(done) {
    var browser = utils.app.browser;
    browser.visit('/', function() {
      browser.wait(10000, function() {
        assert.ok(browser.success);
        done();
      });
    });
  });

  it('Should create resource from URL', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step1-wrapper'), 'It should be step #1');
    browser.fill('step1-resource-url', exampleResourceUrl);
    setTimeout(function() {
      browser.wait(10000, function() {
        setTimeout(function() {
          browser.wait(10000, function() {
            assert(browser.query('#step1-button-next'),
              'Next button should be available');
            browser.click('#step1-button-next');
            browser.wait(1000, function() {
              assert(browser.query('#step2-wrapper'), 'It should be step #2');
              done();
            });
          });
        }, 1000);
      });
    }, 1000);
  });

  it('Should map required concepts', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step2-wrapper'), 'It should be step #2');

    browser.evaluate('$("#step2-concept-0")' +
      '.val("string:mapping.measures.amount").change();');
    browser.evaluate('$("#step2-concept-1")' +
      '.val("string:mapping.date.properties.year").change();');

    setTimeout(function() {
      browser.wait(10000, function() {
        assert(browser.query('#step2-button-next'),
          'Next button should be available');
        browser.click('#step2-button-next');
        browser.wait(1000, function() {
          assert(browser.query('#step3-wrapper'), 'It should be step #3');
          done();
        });
      });
    }, 1000);
  });

  it('Should fill metadata', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step3-wrapper'), 'It should be step #3');
    browser.fill('title', dataPackageTitle);
    browser.wait(10000, function() {
      setTimeout(function() {
        browser.wait(10000, function() {
          setTimeout(function() {
            browser.wait(10000, function() {
              assert(browser.query('#step3-button-next'),
                'Next button should be available');
              browser.click('#step3-button-next');
              browser.wait(1000, function() {
                assert(browser.query('#step4-wrapper'), 'It should be step #4');
                done();
              });
            });
          }, 1000);
        });
      }, 5000);
    });
  });

  it('Should allow to download package', function(done) {
    var browser = utils.app.browser;
    assert(browser.query('#step4-wrapper'), 'It should be step #4');
    setTimeout(function() {
      browser.wait(10000, function() {
        assert(browser.query('#step4-button-download'),
          'Download button should be available');
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
    }, 1000);
  });

});
