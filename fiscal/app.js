'use strict';

var Promise = require('bluebird');
var express = require('express');
var nunjucks = require('nunjucks');
var marked = require('marked');
var path = require('path');

var config = require('./config');
var routes = require('./routes');

module.exports.start = function() {
  return new Promise(function(resolve, reject) {
    var app = express();

    app.set('config', config);
    app.set('port', config.get('app:port'));
    app.set('views', path.join(__dirname, '/views'));

    app.use(express.static(path.join(__dirname, '/public')));

    app.use(routes.pages());

    var env = nunjucks.configure(app.get('views'), {
      autoescape: true,
      express: app
    });
    env.marked = marked;

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
