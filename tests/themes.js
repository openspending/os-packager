// jscs:disable maximumLineLength
'use strict';

var assert = require('chai').assert;
var themes = require('../app/config/themes');

describe('Themes', function() {
  it('Should return the default theme if called without params', function() {
    var theme = themes.get();
    assert.deepEqual(theme, themes.themes.default);
  });

  it('Should return the default theme if the theme asked does not exist', function() {
    var theme = themes.get('UNKNOWN_THEME');
    assert.deepEqual(theme, themes.themes.default);
  });

  it('Should return the requested theme', function() {
    themes.themes.foobar = {
      foo: 'bar'
    };

    var theme = themes.get('foobar');
    delete themes.themes.foobar;

    assert.equal(theme.foo, 'bar');
  });

  it('Should merge the requested theme with the default theme before returning', function() {
    themes.themes.foobar = {
      foo: 'bar'
    };

    var foobarTheme = themes.get('foobar');
    var defaultTheme = themes.get();

    delete themes.themes.foobar;

    assert.deepEqual(foobarTheme, Object.assign({}, defaultTheme, foobarTheme));
  });
});
