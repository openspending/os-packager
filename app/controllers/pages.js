'use strict';

var services = require('../services');
var _ = require('underscore');

function getBasePath(config) {
  var result = config.get('basePath');
  if (_.isUndefined(result) || _.isNull(result) || (result == '')) {
    return '';
  }
  result = '' + result;
  if (result[0] != '/') {
    result = '/' + result;
  }
  return result;
}

module.exports.main = function(req, res) {
  var config = req.app.get('config');
  var basePath = getBasePath(config);

  res.render('pages/main.html', {
    conductor: config.get('conductor'),
    basePath: basePath,
    title: 'Create a Fiscal Data Package'
  });
};

module.exports.landing = function(req, res) {
  var config = req.app.get('config');
  var basePath = getBasePath(config);
  var firstStep = _.first(services.data.steps);

  res.render('pages/landing.html', {
    conductor: config.get('conductor'),
    basePath: basePath,
    title: 'OS Packager',
    getStartedUrl: basePath + firstStep.route
  });
};

module.exports.templates = function(req, res) {
  var path = req.params[0];
  res.render('partials/' + path);
};
