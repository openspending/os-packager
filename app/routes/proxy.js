'use strict';

var express = require('express');
var proxy = require('../controllers/proxy');

module.exports = function() {
  var router = express.Router(); // eslint-disable-line

  router.all('/proxy', proxy.proxy);
  router.post('/download/*', proxy.download);

  return router;
};
