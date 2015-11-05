'use strict';

var validator = require('validator');
var request = require('request');

module.exports.proxy = function(req, res) {
  var url = req.query.url;

  if(!validator.isURL(url)) {
    res.status(400).send('URL you passed is invalid');
    return false;
  }

  req.pipe(request(url)).pipe(res);
};