# OS Packager

[![Gitter](https://img.shields.io/gitter/room/openspending/chat.svg)](https://gitter.im/openspending/chat)
[![Issues](https://img.shields.io/badge/issue-tracker-orange.svg)](https://github.com/openspending/openspending/issues)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](http://docs.openspending.org/en/latest/developers/packager/)
[![Docker Build Status](https://img.shields.io/docker/build/openspending/os-packager.svg)](https://hub.docker.com/r/openspending/os-packager/)

An app to make Fiscal Data Packages from a CSV of Fiscal Data, and publish those packages to OpenSpending.

## Quick start

- get the code
`git clone https://github.com/openspending/os-packager.git`

- install dependencies
`npm install`

- build the frontend assets
`npm run build`

- configure .env

For local development, add an `.env` file with the following settings:
```ini
# Required settings
# e.g. https://openspending.org or http://localhost
OS_BASE_URL=

# Optional settings
OS_SNIPPETS_GA=
OS_SNIPPETS_RAVEN=
SENTRY_DSN=
OS_PACKAGER_BASE_PATH=
POLL_INTERVAL=

# Each service will use OS_BASE_URL unless overridden by these:
OS_CONDUCTOR_URL=
OS_VIEWER_URL=
OS_ADMIN_URL=
FDP_ADAPTER_URL=

# Defaults to 'https://cosmopolitan.openspending.org/?format=json'
OS_COSMOPOLITAN_URL=
```

- run the tests
`npm test`

- run the server
`npm start`

- load the app in your default browser
`open http://127.0.0.1:5000`


See the [docs](http://docs.openspending.org/en/latest/developers/packager/) for more information.

