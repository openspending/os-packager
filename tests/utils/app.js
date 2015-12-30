'use strict';

var Promise = require('bluebird');
var Browser = require('zombie');
var start = require('../../app').start;

var exports = module.exports;

exports.app = null;
exports.browser = null;

function waitForDigest(iterationCount) {
  var browser = this;

  iterationCount = parseFloat(iterationCount);
  if (!isFinite(iterationCount)) {
    iterationCount = 3;
  }

  function waiter(resolve) {
    browser.wait(10000, function() {
      iterationCount -= 1;
      if (iterationCount <= 0) {
        resolve();
      } else {
        setTimeout(function() {
          waiter(resolve);
        }, 500);
      }
    });
  }

  return new Promise(function(resolve, reject) {
    waiter(resolve);
  });
}

exports.start = function(done) {
  this.timeout(20000);
  if (!exports.app) {
    // Run the server
    start().then(function(app) {
      exports.app = app;
      var port = app.get('port');
      Browser.localhost('127.0.0.1', port);
      exports.browser = new Browser({
        maxWait: 5000
      });
      //exports.browser.debug();
      exports.browser.waitForDigest = waitForDigest;
      done();
    });
  }
};

exports.shutdown = function(done) {
  exports.app.shutdown();
  exports.app = null;
  exports.browser = null;
  done();
};
