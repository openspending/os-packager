module.exports = {
  // Required settings
  OS_BASE_URL: {required: true},

  // Optional settings
  OS_SNIPPETS_GA: {required: false},
  OS_SNIPPETS_RAVEN: {required: false},
  SENTRY_DSN: {required: false},
  OS_PACKAGER_BASE_PATH: {
    default: 'fudge'
  },
  POLL_INTERVAL: {required: false},

  // Each service will use OS_BASE_URL unless overridden by these:
  OS_CONDUCTOR_URL: {required: false},
  OS_VIEWER_URL: {required: false},
  OS_ADMIN_URL: {required: false},
  FDP_ADAPTER_URL: {required: false}
};
