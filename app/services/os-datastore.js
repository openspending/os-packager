'use strict';

var _ = require('underscore');
var crypto = require('crypto');
var Promise = require('bluebird');
require('isomorphic-fetch');

// TODO: Use real content-type if available, and fall back to 'application/octet-stream'
// TODO: Review UI & state change stuff

var defaultOptions = {
  conductorUrl: 'http://os-conductor.herokuapp.com/datastore/',
  apiKey: 'openspending-next',
  owner: '__tests',
  name: 'test-datapackage'
};
module.exports.defaultOptions = defaultOptions;

var ProcessingStatus = {
  DOWNLOADING: 'downloading',
  READING: 'reading',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
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
    xhr.upload.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        if (_.isFunction(options.onUploadProgress)) {
          // normalized to range 0.0 .. 1.0
          options.onUploadProgress(event.loaded / event.total);
        }
      }
    });
    xhr.upload.addEventListener('load', function(event) {
      if (_.isFunction(options.onUploadProgress)) {
        // normalized to range 0.0 .. 1.0
        options.onUploadProgress(1.0);
      }
    });
    xhr.upload.addEventListener('error', function(event) {
      reject('An error occurred while transferring the file.');
    });
    xhr.upload.addEventListener('abort', function(event) {
      reject('The transfer has been canceled by the user.');
    });

    // Download events
    xhr.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        if (_.isFunction(options.onDownloadProgress)) {
          // normalized to range 0.0 .. 1.0
          options.onDownloadProgress(event.loaded / event.total);
        }
      }
    });
    xhr.addEventListener('load', function(event) {
      if (_.isFunction(options.onDownloadProgress)) {
        // normalized to range 0.0 .. 1.0
        options.onDownloadProgress(1.0);
      }
      resolve(xhr.responseText);
    });
    xhr.addEventListener('error', function(event) {
      reject('An error occurred while transferring the file.');
    });
    xhr.addEventListener('abort', function(event) {
      reject('The transfer has been canceled by the user.');
    });

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
  if ((typeof XMLHttpRequest != 'undefined') && _.isFunction(XMLHttpRequest)) {
    return requestViaXhr(url, options);
  }
  if ((typeof fetch != 'undefined') && _.isFunction(fetch)) {
    return requestViaFetch(url, options);
  }
  return Promise.reject('Both XMLHttpRequest and fetch API are not supported.')
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
      name: options.name
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
      'API-Key': options.apiKey
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
      return response.json()
    })
    .then(function(response) {
      if (_.isObject(response.filedata)) {
        return _.chain(response.filedata)
          .map(function(item, key) {
            return [
              key,
              {
                uploadUrl: item.upload_url,
                uploadParams: _.chain(item.upload_query)
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

module.exports.readContents = function(descriptor) {
  var options = {
    onDownloadProgress: function(value) {
      descriptor.progress = value;
    }
  };
  descriptor.progress = 0.0;

  var result = null;

  if (_.isString(descriptor.url)) {
    descriptor.status = ProcessingStatus.DOWNLOADING;
    result = requestAutoDetect(descriptor.url, options);
  } else
  if (_.isObject(descriptor.file)) {
    descriptor.status = ProcessingStatus.READING;
    result = readFileBytes(descriptor.file, options);
  } else {
    var data = descriptor.data || '';
    if (!_.isString(data) && _.isObject(data)) {
      data = JSON.stringify(data, null, 2);
    }
    result = Promise.resolve(data);
  }

  return result
    .then(function(data) {
      descriptor.progress = 1.0;
      descriptor.data = data;
      return descriptor;
    });
};

module.exports.prepareForUpload = function(descriptor, options) {
  descriptor.status = ProcessingStatus.PREPARING;
  descriptor.progress = 0.0;
  return prepareFilesForUpload([descriptor], options)
    .then(function(results) {
      _.extend(descriptor, results[descriptor.name]);
      descriptor.progress = 1.0;
      return descriptor;
    });
};

module.exports.upload = function(descriptor) {
  var options = {
    onUploadProgress: function(value) {
      descriptor.progress = value;
    }
  };
  descriptor.status = ProcessingStatus.UPLOADING;
  descriptor.progress = 0.0;
  return uploadFile(descriptor, options)
    .then(function() {
      descriptor.progress = 1.0;
      return descriptor;
    });
};
