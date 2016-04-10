'use strict';

var services = require('../services');
var _ = require('underscore');

module.exports.main = function(req, res) {
  var config = req.app.get('config');
  res.render('pages/main.html', {
    conductor: config.get('conductor'),
    basePath: config.get('basePath'),
    title: 'Create a Fiscal Data Package'
  });
};

module.exports.landing = function(req, res) {
  var firstStep = _.first(services.data.steps);

  res.render('pages/landing.html', {
    title: 'OS Packager',
    getStartedUrl: firstStep.route
  });
};

module.exports.templates = function(req, res) {
  var path = req.params[0];
  res.render('partials/' + path);
};
