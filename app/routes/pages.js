'use strict';

var _ = require('underscore');
var express = require('express');
var pages = require('../controllers/pages');

module.exports = function() {
  var router = express.Router();

  var steps = require('../services').data.steps;
  _.each(steps, function(step) {
    router.get(step.route, pages.main);
  });

  router.get('/', pages.landing);
  router.get('/logged-in', pages.loggedIn);
  router.get('/templates/*', pages.templates);

  return router;
};
