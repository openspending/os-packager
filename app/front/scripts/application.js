'use strict';

var angular = require('angular');
require('angular-route');
require('angular-animate');

angular.module('Application', [
  'ngRoute',
  'ngAnimate',
  'authClient.services'
]);

require('./config');
require('./filters');
require('./controllers');
require('./directives');
require('./animations');
require('./services');
