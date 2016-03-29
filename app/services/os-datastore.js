'use strict';

var _ = require('underscore');
var crypto = require('crypto');
var Promise = require('bluebird');
require('isomorphic-fetch');

var OS_CONDUCTOR = process.env.OS_PACKAGER_CONDUCTOR_HOST || 'http://next.openspending.org';
var defaultOptions = {
  conductorUrl: OS_CONDUCTOR+'/datastore/',
  publishUrl: OS_CONDUCTOR+'/hooks/load/api/',
  pollInterval: 3000,
};
module.exports.defaultOptions = defaultOptions;

var ProcessingStatus = {
  DOWNLOADING: 'downloading',
  READING: 'reading',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  PUBLISHING: 'publishing',
  READY: 'ready',
  FAILED: 'failed'
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
    return response.text();
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
      resolve(xhr.responseText);
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
    var reader = new FileReader();

    reader.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        if (_.isFunction(options.onDownloadProgress)) {
          // normalized to range 0.0 .. 1.0
          options.onDownloadProgress(event.loaded / event.total);
        }
      }
    });
    reader.addEventListener('load', function(event) {
      if (_.isFunction(options.onDownloadProgress)) {
        // normalized to range 0.0 .. 1.0
        options.onDownloadProgress(1.0);
      }
      resolve(reader.result);
    });
    reader.addEventListener('error', function(event) {
      reject('An error occurred while reading the file.');
    });
    reader.addEventListener('abort', function(event) {
      reject('Reading has been canceled by the user.');
    });

    reader.readAsBinaryString(fileOrBlob);
  });
}

function md5(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  return md5sum.digest('base64');
}

function uploadFile(descriptor, options) {
  var requestOptions = _.extend({}, options, {
    method: 'PUT',
    headers: _.extend({}, options.headers, {
      'Content-Length': descriptor.data.length,
      'Content-MD5': md5(descriptor.data),
      'Content-Type': 'application/octet-stream'
    }),
    body: descriptor.data,
    mode: 'cors',
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
            md5: md5(item.data),
            name: item.name,
            length: item.data.length,
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
      'Auth-Token': options.permission_token
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
  if (_.isObject(descriptor.file) && (descriptor.file instanceof Blob)) {
    descriptor.status = ProcessingStatus.READING;
    result = readFileBytes(descriptor.file, options);
  } else {
    var data = descriptor.data || '';
    if (_.isObject(descriptor.file)) {
      data = descriptor.file.data || '';
    }
    if (!_.isString(data) && _.isObject(data)) {
      data = JSON.stringify(data, null, 2);
    }
    result = Promise.resolve(data);
  }

  return result
    .then(function(data) {
      descriptor.progress = 1.0;
      descriptor.data = data;
      descriptor.countOfLines = 0;
      for (var i = 0; i < data.length; i++) {
        if (data[i] == '\n') {
          descriptor.countOfLines ++;
        }
      }
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

    var pollUrl = options.publishUrl +
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
          switch (('' + response.status).toLowerCase()) {
            case 'success':
            case 'done':
              descriptor.progress = 1.0;
              resolve(descriptor);
              break;
            case 'fail':
              throw response.error; // Go to .catch()
              break;
            default:
              // response.progress is count of processed lines
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
    fetch(pollUrl, requestOptions)
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
