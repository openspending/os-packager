'use strict';

var Promise = require('bluebird');
var express = require('express');
var nunjucks = require('nunjucks');
var marked = require('marked');
var path = require('path');
var bodyParser = require('body-parser');

var config = require('./config');
var routes = require('./routes');
var Raven = require('raven');

module.exports.start = function(port) {
  return new Promise(function(resolve, reject) {
    var app = express();

    app.set('trust proxy', true);

    app.set('config', config);
    var usePort = config.get('app:port');
    if (port) {
      usePort = port;
    }
    app.set('port', usePort);
    app.set('views', path.join(__dirname, '/views'));

    // Sentry monitoring
    var sentryDSN = config.get('sentryDSN');
    if (sentryDSN != null) {
      Raven.config(sentryDSN).install();
      app.use(Raven.requestHandler());
      app.use(Raven.errorHandler());

      // Fallthrough error handler
      app.use(function onError(err, req, res, next) {
        // The error id is attached to `res.sentry` to be returned
        // and optionally displayed to the user for support.
        res.statusCode = 500;
        res.end('An error occurred: ' + res.sentry + '\n');
      });
    } else {
      console.log('Sentry DSN not configured');
    }

    // Middlewares
    if (config.get('env') == 'test') {
      app.use(express.static(path.join(__dirname, '/../tests/data')));
    }

    app.use([
      express.static(path.join(__dirname, '/public')),
      bodyParser.urlencoded({
        extended: true,
        limit: '20Mb'
      })
    ]);

    // Controllers
    app.use([
      routes.pages(),
      routes.proxy()
    ]);

    var env = nunjucks.configure(app.get('views'), {
      autoescape: true,
      express: app
    });
    env.addGlobal('globalConfig', {
      snippets: config.get('env') != 'test' ? config.get('snippets') : {}
    });
    env.addGlobal('marked', marked);
    env.addGlobal('sessionSalt', '' + Date.now() +
      Math.round(Math.random() * 10000));
    env.addFilter('json', function(value, pretty) {
      return JSON.stringify(value, null, !!pretty ? 2 : null);
    });
    env.addFilter('stringify', function(str) {
      return env.getFilter('safe')(JSON.stringify(str));
    });

    var server = app.listen(app.get('port'), function() {
      console.log('Listening on :' + app.get('port'));
      resolve(app);
    });
    app.shutdown = function() {
      server.close();
      server = null;
    };
  });
};
