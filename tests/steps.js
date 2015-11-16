'use strict';

var assert = require('chai').assert;
var utils = require('./utils');

var exampleResourceUrl = 'https://raw.githubusercontent.com/okfn/goodtables/' +
  'master/examples/valid.csv';

describe.skip('Wizard UI', function() {
  this.timeout(20000);

  before(utils.app.start);
  after(utils.app.shutdown);

  it('Should open main page', function(done) {
    var browser = utils.app.browser;
    browser.visit('/', function() {
      assert.ok(browser.success);

      browser.fill('step1-resource-url', exampleResourceUrl);
      browser.wait({
        duration: '10s',
        element: '#step1-button-next'
      }, function() {
        setTimeout(function() {
          console.log(browser.query('#step1-button-next'));
          done();
        }, 5000);
      })
    });
  });

});
