'use strict';

var validator = require('validator');
var request = require('request');

module.exports.proxy = function(req, res) {
  var url = req.query.url;

  if (!validator.isURL(url)) {
    res.status(400).send('URL you passed is invalid');
    return false;
  }

  try {
    req.on('error', function(error) {
      console.trace(error);
      res.sendStatus(404);
    });
    var proxy = request(url);
    proxy.on('error', function(error) {
      console.trace(error);
      res.sendStatus(404);
    });
    req.pipe(proxy).pipe(res);
  } catch (e) {
    res.sendStatus(404);
  }
};

module.exports.download = function(req, res) {
  res.status(200);
  if (req.body.name) {
    res.attachment(req.body.name);
  }
  if (req.body.mime) {
    res.set('Content-Type', req.body.mime);
  }
  res.send(req.body.data || '');
};
