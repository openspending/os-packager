'use strict';

var path = require('path');
var nconf = require('nconf');

const DEFAULT_HOST = 'http://next.openspending.org';
const DEFAULT_BASE_PATH = '';

nconf.file({
  file: path.join(__dirname, '/../../settings.json')
});

var conductorHost = process.env.OS_PACKAGER_CONDUCTOR_HOST || DEFAULT_HOST;

// this is the object that you want to override in your own local config
nconf.defaults({
  env: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG || false,
  app: {
    port: process.env.PORT || 5000
  },
  conductor: {
    url: conductorHost,
    pollInterval: process.env.POLL_INTERVAL || 3000
  },
  fdpAdapterUrl: process.env.FDP_ADAPTER_URL ||
    DEFAULT_HOST + '/fdp-adapter/convert',
  basePath: process.env.OS_PACKAGER_BASE_PATH || DEFAULT_BASE_PATH
});

module.exports = {
  get: nconf.get.bind(nconf),
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf)
};
