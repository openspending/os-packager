'use strict';

var angular = require('angular');
require('angular-route');
require('angular-animate');

if (globalConfig.snippets.raven) {
  var Raven = require('raven-js');
  Raven
    .config(globalConfig.snippets.raven, {logger: 'os-packager-angular'})
    .addPlugin(require('raven-js/plugins/angular'), angular)
    .install();
}

var moduleDeps = [
  'ngRoute',
  'ngAnimate',
  'authClient.services'
];
if (globalConfig.snippets.raven) {
  moduleDeps.unshift('ngRaven');
}

angular.module('Application', moduleDeps);

require('./config');
require('./filters');
require('./controllers');
require('./directives');
require('./animations');
require('./services');
