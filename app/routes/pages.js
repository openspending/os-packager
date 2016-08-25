'use strict';

var _ = require('lodash');
var express = require('express');
var pages = require('../controllers/pages');

module.exports = function() {
  var router = express.Router();

  var steps = require('../services').data.steps;
  var firstStep = _.first(steps);
  var restSteps = _.slice(steps, 1);
  router.get(firstStep.route, pages.main);
  _.each(restSteps, function(step) {
    router.get(step.route, pages.redirectToMain);
  });

  router.get('/', pages.landing);
  router.get('/logged-in', pages.loggedIn);
  router.get('/templates/*', pages.templates);

  return router;
};
