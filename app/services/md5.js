'use strict';

var CryptoJS = require('crypto-js');

function arrayBufferToWordArray(buffer) {
  var bytes = new Uint8Array(buffer);
  var result = [];
  for (var i = 0; i < bytes.length; i += 4) {
    result.push(
      bytes[i    ] << 24 |  // eslint-disable-line
      bytes[i + 1] << 16 |
      bytes[i + 2] << 8 |
      bytes[i + 3]
    );
  }
  return CryptoJS.lib.WordArray.create(result, bytes.length);
}

function Md5Hash() {
  this._md5 = CryptoJS.algo.MD5.create();
  this._md5.init();
  this._hash = null;
}

var proto = Md5Hash.prototype = {};

proto.update = function(data) {
  if (this._md5) {
    if ((typeof ArrayBuffer == 'function') && (data instanceof ArrayBuffer)) {
      data = arrayBufferToWordArray(data);
    }
    this._md5.update(data);
  }
  return this;
};

proto.finalize = function() {
  if (!this._hash) {
    this._hash = this._md5.finalize();
    this._md5 = undefined;
  }
  return this;
};

proto.hex = function() {
  this.finalize();
  if (this._hash) {
    return this._hash.toString(CryptoJS.enc.Hex);
  }
  return null;
};

proto.base64 = function() {
  this.finalize();
  if (this._hash) {
    return this._hash.toString(CryptoJS.enc.Base64);
  }
  return null;
};

module.exports = Md5Hash;
