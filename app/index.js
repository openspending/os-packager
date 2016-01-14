'use strict';

var Promise = require('bluebird');
var express = require('express');
var nunjucks = require('nunjucks');
var marked = require('marked');
var path = require('path');
var bodyParser = require('body-parser');

var config = require('./config');
var routes = require('./routes');

module.exports.start = function() {
  return new Promise(function(resolve, reject) {
    var app = express();

    app.set('config', config);
    app.set('port', config.get('app:port'));
    app.set('views', path.join(__dirname, '/views'));

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
    env.addGlobal('marked', marked);
    env.addGlobal('sessionSalt', '' + Date.now() +
      Math.round(Math.random() * 10000));
    env.addFilter('json', function(value, pretty) {
      return JSON.stringify(value, null, !!pretty ? 2 : null);
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
