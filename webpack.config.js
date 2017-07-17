'use strict';

var webpack = require('webpack');

var plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
];

if (process.env.NODE_ENV == 'production') {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,
        warnings: false
      }
    })
  );
}

module.exports = {
  entry: './app/front/scripts/index.js',
  devtool: 'source-map',
  output: {
    filename: 'app.js',
    path: './app/public/scripts'
  },
  node: {
    // `datapackage-validate` depends on `fs` and `requests` which
    // depends on `net` and `tls`; mock it as we just use `validate`.
    // TODO: Replace `datapackage-validate` with newer version
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  module: {
    loaders: [
      {test: /\.html$/, loader: 'raw'},
      {test: /\.json/, loader: 'json'}
    ]
  },
  plugins: plugins
};
