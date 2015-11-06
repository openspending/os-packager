'use strict';

var express = require('express');
var proxy = require('../controllers/proxy');

module.exports = function() {
  var router = express.Router();

  router.get('/proxy', proxy.proxy);

  return router;
};
