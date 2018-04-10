'use strict';

/* global window */

var _ = require('lodash');
var url = require('url');
var downloader = require('./downloader');
var Promise = require('bluebird');

module.exports.defaultSettingsUrl = 'config.json';
module.exports.conductorUrl = 'https://openspending.org';
module.exports.publishUrl = module.exports.conductorUrl + '/package/publish';
module.exports.searchUrl = module.exports.conductorUrl + '/search/package';
module.exports.pollInterval = 1000;

var RemoteProcessingStatus = {
  'queued': 'Waiting in queue for an available processor',
  'initializing': 'Getting ready to load the package',
  'loading-datapackage': 'Reading the Fiscal Data Package',
  'validating-datapackage': 'Validagin Data Package correctness',
  'loading-resource': 'Loading Resource data',
  'deleting-table': 'Clearing previous rows for this dataset from the database',
  'creating-table': 'Preparing space for rows in the database',
  'loading-data-ready': 'Starting to load rows to database',
  'loading-data': 'Loading data into the database',
  'creating-babbage-model': 'Converting the Data Package into an API model',
  'saving-metadata': 'Saving package metadata',
  'done': 'Done',
  'fail': 'Failed'
};

function getSettings(settingsUrl) {
  return Promise.resolve(window.globalConfig || {});
}

function updateUserProfile(authToken, profileData) {
  var url = module.exports.conductorUrl + '/user/update';

  profileData = _.pick(profileData || {}, [
    'username'
  ]);

  var data = _.chain(profileData)
  .map(function(value, key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
  })
  .push('jwt=' + encodeURIComponent(authToken))
  .join('&')
  .value();

  var options = {
    method: 'POST'
  };
  return downloader.getJson(url + '?' + data, options, true)
  .then(function(result) {
    if (!result.success) {
      throw new Error(result.error);
    }
    return profileData;
  });
}

function getDataPackageMetadata(dataPackage) {
  var originUrl = dataPackage.origin_url || dataPackage.__origin_url || [
      '//datastore.openspending.org',
      dataPackage.package.owner,
      dataPackage.package.name,
      'datapackage.json'
    ].join('/');
  originUrl = originUrl.replace(/^http:/, 'https:');

  var totalCountOfRecords = (function(dataPackage) {
    var result = 0;

    _.each(dataPackage.resources, function(resource) {
      var count = parseInt(resource.count_of_rows, 10) || 0;
      if (count > 0) {
        result += count;
      }
    });
    if (result == 0) {
      var count = parseInt(dataPackage.count_of_rows, 10) || 0;
      if (count > 0) {
        result = count;
      }
    }

    return result;
  })(dataPackage.package);

  var totalSizeOfResources = _.chain(dataPackage.package.resources)
  .map(function(resource) {
    var result = parseInt(resource.bytes, 10) || 0;
    return result > 0 ? result : 0;
  })
  .sum()
  .value();

  return {
    id: dataPackage.id,
    name: dataPackage.package.name,
    title: dataPackage.package.title,
    description: dataPackage.package.description,
    owner: dataPackage.package.owner,
    isPublished: !dataPackage.package.private,
    last_update: dataPackage.last_update ? dataPackage.last_update * 1000 : 0,
    totalCountOfResources: _.get(dataPackage, 'package.resources.length', 0),
    totalCountOfRecords: totalCountOfRecords,
    totalSizeOfResources: totalSizeOfResources,
    loadingStatus: (function() {
      // Old packages will have no `loaded`/`loading_*` properties;
      // treat them as successfully loaded.

      var isLoaded = _.isUndefined(dataPackage.loaded) ? true :
        !!dataPackage.loaded;

      var loadingStatus = isLoaded ? 'done' :
        (dataPackage.loaging_status || 'queued');

      var isFailed = loadingStatus == 'fail';

      var result = {
        loaded: isLoaded,
        failed: isFailed,
        status: loadingStatus,
        message: RemoteProcessingStatus[loadingStatus] ||
        RemoteProcessingStatus.queued,
        error: isFailed ? dataPackage.loading_error : null
      };

      // Show UI message for failed and in-progress packages
      result.showMessage = !result.loaded;

      // Calculate count of rows (if available)
      result.countOfRecords = totalCountOfRecords;
      result.processedRecords = 0;

      return result;
    })(),
    author: _.chain(dataPackage.package.author)
    .split(' ')
    .dropRight(1)
    .join(' ')
    .value(),
    url: originUrl,
    resources: _.chain(dataPackage.package.resources)
    .map(function(resource) {
      var resourceUrl = null;
      if (resource.url) {
        resourceUrl = resource.url;
      }
      if (resource.path) {
        resourceUrl = url.resolve(originUrl, resource.path);
      }

      if (resourceUrl) {
        return {
          name: resource.name,
          url: resourceUrl
        };
      }
    })
    .filter()
    .value()
  };
}

function getDataPackageLoadingStatus(dataPackage) {
  var url = module.exports.conductorUrl + '/package/status' +
    '?datapackage=' + encodeURIComponent(dataPackage.url);

  return fetch(url)
  .then(function(response) {
    if (response.status != 200) {
      throw new Error('Failed to load data from ' + response.url);
    }
    return response.json();
  })
  .then(function(response) {
    if (!_.isObject(response)) {
      throw new Error('Response should be an object');
    }
    var responseStatus = ('' + response.status).toLowerCase();
    if (responseStatus == 'fail') {
      throw new Error(response.error); // Go to .catch()
    } else {
      var progress = parseInt(response.progress, 10) || 0;
      if (progress < 0) {
        progress = 0;
      }
      return {
        status: responseStatus,
        progress: progress
      };
    }
  });
}

function pollPackageStatus(dataPackage, dataPackageUpdatedCallback) {
  if (_.isObject(dataPackage.loadingStatus)) {
    var status = dataPackage.loadingStatus;
    // If package was not loaded and there is no error - it's still loading
    if (!status.loaded && !status.error) {
      dataPackage.loadingStatus.showMessage = true;
      dataPackage.loadingStatus.processedRecords = 0;
      var poll = function() {
        getDataPackageLoadingStatus(dataPackage)
        .then(function(result) {
          var loadingStatus = dataPackage.loadingStatus;

          loadingStatus.loaded = result.status == 'done';
          loadingStatus.failed = false;
          loadingStatus.status = result.status;
          loadingStatus.message = RemoteProcessingStatus[result.status];
          loadingStatus.error = null;
          loadingStatus.processedRecords = result.progress;

          if (loadingStatus.processedRecords > loadingStatus.countOfRecords) {
            if (loadingStatus.countOfRecords > 0) {
              loadingStatus.processedRecords = loadingStatus.countOfRecords;
            }
          }

          if (_.isFunction(dataPackageUpdatedCallback)) {
            dataPackageUpdatedCallback(dataPackage);
          }

          if (result.status != 'done') {
            setTimeout(poll, module.exports.pollInterval);
          } else {
            loadingStatus.processedRecords = loadingStatus.countOfRecords;
          }
        })
        .catch(function(error) {
          var loadingStatus = dataPackage.loadingStatus;

          loadingStatus.loaded = false;
          loadingStatus.failed = true;
          loadingStatus.status = 'fail';
          loadingStatus.message = RemoteProcessingStatus.fail;
          loadingStatus.error = error.message;

          if (_.isFunction(dataPackageUpdatedCallback)) {
            dataPackageUpdatedCallback(dataPackage);
          }
        });
      };
      poll();
    }
  }
  return dataPackage;
}

function getDataPackages(authToken, userid, dataPackageUpdatedCallback) {
  var url = module.exports.searchUrl + '?size=10000';
  if (authToken) {
    url += '&jwt=' + encodeURIComponent(authToken);
  }
  if (userid) {
    url += '&package.owner=' + encodeURIComponent(JSON.stringify(userid));
  }
  return downloader.getJson(url).then(function(packages) {
    return _.chain(packages)
    .map(getDataPackageMetadata)
    .map(function(dataPackage) {
      return pollPackageStatus(dataPackage, dataPackageUpdatedCallback);
    })
    .sortBy(function(item) {
      return item.title;
    })
    .value();
  });
}

function togglePackagePublicationStatus(permissionToken, dataPackage) {
  var url = module.exports.conductorUrl + '/package/publish';

  var data = _.chain({
    jwt: permissionToken,
    id: dataPackage.id,
    publish: 'toggle'
  })
  .map(function(value, key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
  })
  .join('&')
  .value();

  var options = {
    method: 'POST'
  };
  return downloader.getJson(url + '?' + data, options, true)
  .then(function(result) {
    if (!result.success) {
      throw new Error(result.error);
    }
    dataPackage.isPublished = !!result.published;
    return dataPackage;
  });
}

function deletePackage(permissionToken, dataPackage) {
  var url = module.exports.conductorUrl + '/package/delete';

  var data = _.chain({
    jwt: permissionToken,
    id: dataPackage.id
  })
  .map(function(value, key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
  })
  .join('&')
  .value();

  var options = {
    method: 'POST'
  };
  return downloader.getJson(url + '?' + data, options, true)
  .then(function(result) {
    if (!result.success) {
      throw new Error(result.error);
    }
    return dataPackage;
  });
}


function runWebHooks(permissionToken, dataPackage) {
  var url = module.exports.conductorUrl + '/package/run-hooks';

  var data = _.chain({
    jwt: permissionToken,
    id: dataPackage.id,
    pipeline: 'http://eis-openbudgets.iais.fraunhofer.de/linkedpipes/execute/fdp2rdf'
  })
  .map(function(value, key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
  })
  .join('&')
  .value();

  var options = {
    method: 'POST'
  };
  return downloader.getJson(url + '?' + data, options, true)
  .then(function(result) {
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  });
}

module.exports.getSettings = getSettings;
module.exports.updateUserProfile = updateUserProfile;
module.exports.getDataPackages = getDataPackages;
module.exports.togglePackagePublicationStatus = togglePackagePublicationStatus;
module.exports.deletePackage = deletePackage;
module.exports.runWebHooks = runWebHooks;
