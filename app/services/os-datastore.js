'use strict';

var _ = require('underscore');
var MD5 = require('./md5');
var Promise = require('bluebird');
require('isomorphic-fetch');

var OS_CONDUCTOR = process.env.OS_PACKAGER_CONDUCTOR_HOST ||
  'http://next.openspending.org';
var defaultOptions = {
  conductorUrl: OS_CONDUCTOR + '/datastore/',
  publishUrl: OS_CONDUCTOR + '/package/upload',
  statusUrl: OS_CONDUCTOR + '/package/status',
  pollInterval: 1000
};
module.exports.defaultOptions = defaultOptions;

var ProcessingStatus = {
  DOWNLOADING: 'Downloading',
  READING: 'Reading',
  CALCULATE_HASH: 'Calculating file hash',
  PREPARING: 'Preparing',
  UPLOADING: 'Uploading',
  PUBLISHING: 'Publishing',
  READY: 'Ready',
  FAILED: 'Failed'
};

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

module.exports.ProcessingStatus = ProcessingStatus;

function requestViaFetch(url, options) {
  return new Promise(function(resolve, reject) {
    options.mode = 'cors';
    options.credentials = 'omit';

    if (_.isFunction(options.onUploadProgress)) {
      options.onUploadProgress(0.0); // normalized to range 0.0 .. 1.0
    }

    fetch(url, options)
      .then(resolve)
      .catch(reject);
  })
  .then(function(response) {
    if (response.status != 200) {
      throw 'Failed to load data from ' + response.url;
    }
    if (_.isFunction(options.onUploadProgress)) {
      options.onUploadProgress(1.0); // normalized to range 0.0 .. 1.0
    }
    if (_.isFunction(options.onDownloadProgress)) {
      options.onDownloadProgress(0.0); // normalized to range 0.0 .. 1.0
    }
    return response.blob();
  })
  .then(function(data) {
    if (_.isFunction(options.onDownloadProgress)) {
      options.onDownloadProgress(1.0); // normalized to range 0.0 .. 1.0
    }
    return data;
  });
}

function requestViaXhr(url, options) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    // Upload events
    if (xhr.upload) {
      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
          if (_.isFunction(options.onUploadProgress)) {
            // normalized to range 0.0 .. 1.0
            options.onUploadProgress(event.loaded / event.total);
          }
        }
      };
      xhr.upload.onload = function(event) {
        if (_.isFunction(options.onUploadProgress)) {
          // normalized to range 0.0 .. 1.0
          options.onUploadProgress(1.0);
        }
      };
      xhr.upload.onerror = function(event) {
        reject('An error occurred while transferring the file.');
      };
      xhr.upload.onabort = function(event) {
        reject('The transfer has been canceled by the user.');
      };
    }

    // Download events
    xhr.onprogress = function(event) {
      var total = 0;
      var loaded = event.loaded;
      if (event.lengthComputable) {
        total = event.total;
      } else
      if (xhr.explicitTotal) {
        total = xhr.explicitTotal;
      } else {
        total = parseFloat(xhr.getResponseHeader('Content-Length'));
        if (isFinite(total)) {
          var encoding = xhr.getResponseHeader('Content-Encoding') || 'deflate';
          if (('' + encoding).toLowerCase() != 'deflate') {
            total = total * 17; // Magic number
          }
          xhr.explicitTotal = total;
        } else {
          total = 0;
        }
      }
      if ((total >= loaded) && _.isFunction(options.onDownloadProgress)) {
        // normalized to range 0.0 .. 1.0
        options.onDownloadProgress(loaded / total);
      }
    };
    xhr.onload = function(event) {
      if (_.isFunction(options.onDownloadProgress)) {
        // normalized to range 0.0 .. 1.0
        options.onDownloadProgress(1.0);
      }
      resolve(xhr.response);
    };
    xhr.onerror = function(event) {
      reject('An error occurred while transferring the file.');
    };
    xhr.onabort = function(event) {
      reject('The transfer has been canceled by the user.');
    };

    xhr.open(options.method || 'GET', url);

    // Set headers
    _.each(options.headers, function(value, key) {
      if (('' + key).toLowerCase() == 'content-length') {
        return;
      }
      xhr.setRequestHeader(key, value);
    });

    xhr.responseType = 'blob';

    xhr.send(options.body);
  });
}

function requestAutoDetect(url, options) {
  if (!module.exports.disableXhr) {
    if ((typeof XMLHttpRequest != 'undefined') &&
      _.isFunction(XMLHttpRequest)) {
      return requestViaXhr(url, options);
    }
  }
  if ((typeof fetch != 'undefined') && _.isFunction(fetch)) {
    return requestViaFetch(url, options);
  }
  return Promise.reject('Both XMLHttpRequest and fetch API are not supported.');
}

function readFileBytes(fileOrBlob, options) {
  options = _.isObject(options) ? options : {};
  return new Promise(function(resolve, reject) {
    if (_.isFunction(options.onDownloadProgress)) {
      // normalized to range 0.0 .. 1.0
      options.onDownloadProgress(1.0);
    }
    resolve(fileOrBlob);
  });
}

function calculateBlobMetrics(blob, options) {
  options = _.extend({}, options);
  var onProgress = _.isFunction(options.onProgress) ? options.onProgress : null;

  return new Promise(function(resolve, reject) {
    var blobSize = blob.size;
    var chunkSize = 1024 * 1024;
    var chunkCount = Math.ceil(blobSize / chunkSize);

    // This value is approximate; assume that non-empty file
    // has at least one line
    var countOfLines = blobSize > 0 ? 1 : 0;

    var hash = new MD5();

    var reader = new FileReader();
    var currentChunk = -1;

    var slice = blob.slice || blob.webkitSlice || blob.mozSlice;

    function readNextChunk() {
      currentChunk += 1;
      if (currentChunk < chunkCount) {
        var start = currentChunk * chunkSize;
        var end = start + chunkSize;
        var input = slice.call(blob, start, end);
        reader.readAsArrayBuffer(input);
        if (onProgress) {
          onProgress(start / blobSize);
        }
      } else {
        if (onProgress) {
          onProgress(1.0);
        }
        resolve({
          md5: hash.base64(),
          countOfLines: countOfLines
        });
      }
    }

    reader.addEventListener('load', function(event) {
      hash.update(event.target.result);
      // Update count of lines
      var bytes = new Uint8Array(event.target.result);
      for (var i = 0; i < bytes.length; i++) {
        if (bytes[i] == 10) {
          countOfLines += 1;
        }
      }
      readNextChunk();
    });
    reader.addEventListener('error', function(event) {
      reject(event.target.error);
    });

    readNextChunk();
  });
}

function uploadFile(descriptor, options) {
  var requestOptions = _.extend({}, options, {
    method: 'PUT',
    headers: _.extend({}, options.headers, {
      'Content-Length': descriptor.blob.size,
      'Content-MD5': descriptor.md5,
      'Content-Type': 'application/octet-stream'
    }),
    body: descriptor.blob,
    mode: 'cors',
    redirect: 'follow',
    credentials: 'omit'
  });

  var query = _.chain(descriptor.uploadParams)
    .map(function(value, key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    })
    .join('&')
    .value();

  return requestAutoDetect(descriptor.uploadUrl + '?' + query, requestOptions);
}

function prepareFilesForUpload(files, options) {
  options = _.extend({}, module.exports.defaultOptions, options);

  var payload = {
    metadata: {
      owner: options.owner,
      name: options.name,
      author: options.name
    },
    filedata: _.chain(files)
      .map(function(item) {
        return [
          item.name,
          {
            md5: item.md5,
            name: item.name,
            length: item.blob.size,
            type: 'application/octet-stream'
          }
        ];
      })
      .object()
      .value()
  };

  var requestOptions = {
    method: 'POST',
    headers: {
      // jscs:disable
      'Auth-Token': options.permission_token
      // jscs:enable
    },
    body: JSON.stringify(payload),
    mode: 'cors',
    credentials: 'omit'
  };

  return fetch(options.conductorUrl, requestOptions)
    .then(function(response) {
      if (response.status != 200) {
        throw 'Failed to load data from ' + response.url;
      }
      return response.json();
    })
    .then(function(response) {
      if (_.isObject(response.filedata)) {
        return _.chain(response.filedata)
          .map(function(item, key) {
            // jscs:disable
            var uploadUrl = item.upload_url;
            var uploadParams = item.upload_query;
            // jscs:enable
            return [
              key,
              {
                uploadUrl: uploadUrl,
                uploadParams: _.chain(uploadParams)
                  .map(function(values, key) {
                    return [key, _.first(values)];
                  })
                  .object()
                  .value()
              }
            ];
          })
          .object()
          .value();
      }
      return {};
    });
}

module.exports.readContents = function(descriptor, options) {
  options = _.extend({}, defaultOptions, options, {
    onDownloadProgress: function(value) {
      descriptor.progress = value;
    }
  });
  descriptor.progress = 0.0;

  var result = null;

  if (_.isString(descriptor.url)) {
    descriptor.status = ProcessingStatus.DOWNLOADING;
    options.headers = options.header || {};
    result = requestAutoDetect(descriptor.url, options);
  } else
  if (_.isObject(descriptor.blob) && (descriptor.blob instanceof Blob)) {
    descriptor.status = ProcessingStatus.READING;
    result = readFileBytes(descriptor.blob, options);
  } else {
    var data = descriptor.data || '';
    if (!_.isString(data) && _.isObject(data)) {
      data = JSON.stringify(data, null, 2);
    }
    result = Promise.resolve(new Blob([data], {
      type: 'application/octet-stream'
    }));
  }

  return result
    .then(function(blob) {
      descriptor.progress = 1.0;
      descriptor.blob = blob;
      return descriptor;
    });
};

module.exports.calculateMetrics = function(descriptor) {
  // If metrics already calculated - do nothing; assume that
  // file didn't change
  if (descriptor.md5) {
    return Promise.resolve(descriptor);
  }

  descriptor.status = ProcessingStatus.CALCULATE_HASH;
  descriptor.progress = 0.0;
  return calculateBlobMetrics(descriptor.blob, {
    onProgress: function(value) {
      descriptor.progress = value;
    }
  }).then(function(metrics) {
    descriptor.md5 = metrics.md5;
    descriptor.countOfLines = metrics.countOfLines;
    descriptor.progress = 1.0;
    return descriptor;
  });
};

module.exports.prepareForUpload = function(descriptor, options) {
  options = _.extend({}, defaultOptions, options);
  descriptor.status = ProcessingStatus.PREPARING;
  descriptor.progress = 0.0;
  return prepareFilesForUpload([descriptor], options)
    .then(function(results) {
      _.extend(descriptor, results[descriptor.name]);
      descriptor.progress = 1.0;
      return descriptor;
    });
};

module.exports.upload = function(descriptor, options) {
  options = _.extend({}, defaultOptions, options, {
    onUploadProgress: function(value) {
      descriptor.progress = value;
    }
  });
  descriptor.status = ProcessingStatus.UPLOADING;
  descriptor.progress = 0.0;
  return uploadFile(descriptor, options)
    .then(function() {
      descriptor.progress = 1.0;
      return descriptor;
    });
};

module.exports.publish = function(descriptor, options) {
  return new Promise(function(resolve, reject) {
    options = _.extend({}, module.exports.defaultOptions, options);

    descriptor.status = ProcessingStatus.PUBLISHING;
    descriptor.progress = 0.0;

    var publishUrl = options.publishUrl +
      '?datapackage=' + encodeURIComponent(descriptor.uploadUrl) +
      '&jwt=' + encodeURIComponent(options.permission_token);
    var pollUrl = options.statusUrl +
      '?datapackage=' + encodeURIComponent(descriptor.uploadUrl);

    var poll = function() {
      fetch(pollUrl)
        .then(function(response) {
          if (response.status != 200) {
            throw 'Failed to load data from ' + response.url;
          }
          return response.json();
        })
        .then(function(response) {
          if (!_.isObject(response)) {
            throw 'Response should be an object';
          }
          var responseStatus = ('' + response.status).toLowerCase();
          switch (responseStatus) {
            case 'done':
              descriptor.progress = 1.0;
              resolve(descriptor);
              break;
            case 'fail':
              throw response.error; // Go to .catch()
              break;
            default:
              // response.progress is count of processed lines
              descriptor.status = RemoteProcessingStatus[responseStatus] ||
                responseStatus;
              var progress = parseFloat(response.progress);
              if (isFinite(progress) && (descriptor.countOfLines >= progress)) {
                descriptor.progress = progress / descriptor.countOfLines;
              }
              setTimeout(poll, options.pollInterval);
          }
        })
        .catch(function(error) {
          descriptor.status = ProcessingStatus.FAILED;
          descriptor.error = error;
          reject(error);
        });
    };

    var requestOptions = {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit'
    };
    fetch(publishUrl, requestOptions)
      .then(function() {
        poll();
      })
      .catch(function(error) {
        descriptor.status = ProcessingStatus.FAILED;
        descriptor.error = error;
        reject(error);
      });
  });
};
