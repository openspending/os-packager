'use strict';

var services = require('../services');
var themes = require('../config/themes');
var _ = require('lodash');

function getBasePath(config) {
  var result = config.get('basePath');
  if (_.isUndefined(result) || _.isNull(result) || (result == '')) {
    return '';
  }
  result = '' + result;
  if (result[0] != '/') {
    result = '/' + result;
  }
  if (result.substr(-1, 1) == '/') {
    result = result.substr(0, result.length - 1);
  }
  return result;
}

function render(request, response, view, locals) {
  var config = request.app.get('config');
  var theme = request.query.theme;
  var defaultLocals = {
    frontendOptions: config.get('frontend'),
    basePath: getBasePath(config),
    theme: themes.get(theme)
  };

  return response.render(view, Object.assign(
    {},
    defaultLocals,
    locals || {}
  ));
}

module.exports.main = function(req, res) {
  render(req, res, 'pages/main.html', {
    title: 'Create a Fiscal Data Package'
  });
};

module.exports.redirectToMain = function(req, res) {
  var config = req.app.get('config');
  var basePath = getBasePath(config);

  var steps = require('../services').data.steps;
  var firstStep = _.first(steps);

  var url = basePath + firstStep.route;
  var query = _.chain(req.query)
    .map(function(value, key) {
      return key + '=' + encodeURIComponent(value);
    })
    .join('&')
    .value();
  if (query) {
    url = url + '?' + query;
  }

  res.redirect(302, url);
};

module.exports.landing = function(req, res) {
  var config = req.app.get('config');
  var basePath = getBasePath(config);
  var firstStep = _.first(services.data.steps);

  render(req, res, 'pages/landing.html', {
    title: 'OS Packager',
    getStartedUrl: basePath + firstStep.route
  });
};

module.exports.loggedIn = function(req, res) {
  render(req, res, 'pages/logged-in.html', {
    title: 'OS Packager'
  });
};

module.exports.templates = function(req, res) {
  var path = req.params[0];
  res.render('partials/' + path);
};
