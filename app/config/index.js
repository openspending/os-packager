'use strict';

var path = require('path');
var nconf = require('nconf');

const DEFAULT_HOST = 'http://next.openspending.org';
const DEFAULT_BASE_PATH = '';

nconf.file({
  file: path.join(__dirname, '/../../settings.json')
});

var conductorHost = process.env.OS_PACKAGER_CONDUCTOR_HOST || DEFAULT_HOST;

// Options for frontend
var frontendOptions = {
  conductor: {
    authLibUrl: conductorHost + '/user/lib',
    conductorUrl: conductorHost + '/datastore/',
    conductorInfoUrl: conductorHost + '/datastore/info',
    publishUrl: conductorHost + '/package/upload',
    statusUrl: conductorHost + '/package/status',
    pollInterval: process.env.POLL_INTERVAL || 3000
  },

  adapterUrl: process.env.FDP_ADAPTER_URL ||
    DEFAULT_HOST + '/fdp-adapter/convert',

  proxyUrl: 'proxy?url=',
  osViewerUrl: process.env.OS_VIEWER_URL || DEFAULT_HOST + '/viewer/',
  osAdminUrl: process.env.OS_ADMIN_URL || DEFAULT_HOST + '/admin/'
};

// this is the object that you want to override in your own local config
nconf.defaults({
  env: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG || false,
  app: {
    port: process.env.PORT || 5000
  },
  frontend: frontendOptions,
  basePath: process.env.OS_PACKAGER_BASE_PATH || DEFAULT_BASE_PATH
});

module.exports = nconf;
