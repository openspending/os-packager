'use strict';

var assert = require('chai').assert;
var utils = require('./utils');

describe('Core', function() {
  this.timeout(20000);

  before(utils.app.start);
  after(utils.app.shutdown);

  it('Should be alive', function(done) {
    var browser = utils.app.browser;
    browser.visit('http://localhost:5000/', function() {
      assert.ok(browser.success);
      done();
    });
  });
});
