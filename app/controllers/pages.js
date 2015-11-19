'use strict';

module.exports.main = function(req, res) {
  res.render('pages/main.html', {
    title: 'Fiscal Data Packager'
  });
};

module.exports.wizard = function(req, res) {
  res.render('pages/wizard.html', {
    title: 'Create a Fiscal Data Package'
  });
};

module.exports.about = function(req, res) {
  res.render('pages/about.html', {
    title: 'About'
  });
};
