'use strict';

var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var minifyCss = require('gulp-clean-css');
var prefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var watch = require('gulp-watch');

var frontSrcDir = path.join(__dirname, '/app/front');
var frontScriptsDir = path.join(frontSrcDir, '/scripts');
var frontStylesDir = path.join(frontSrcDir, '/styles');
var frontAssetsDir = path.join(frontSrcDir, '/assets');

var publicDir = path.join(__dirname, '/app/public');
var publicStylesDir = path.join(publicDir, '/styles');
var publicFontsDir = path.join(publicDir, '/fonts');
var publicAssetsDir = path.join(publicDir, '/assets');

var viewsDir = path.join(__dirname, '/app/views');
var servicesDir = path.join(__dirname, '/app/services');

var nodeModulesDir = path.join(__dirname, '/node_modules');

gulp.task('default', [
  'styles',
  'assets'
]);

gulp.task('watch', ['default'], function() {
  var files = [
    path.join(frontScriptsDir, '/**/*.js'),
    path.join(servicesDir, '/**/*.js'),
    path.join(frontStylesDir, '/**/*.less'),
    path.join(viewsDir, '/**/*.html')
  ];
  watch(files, {usePolling: true}, function() {
    gulp.start('default');
  });
});

// Styles

gulp.task('styles', [
  'styles.vendor',
  'styles.application'
]);

gulp.task('styles.application', function() {
  var files = [
    path.join(frontStylesDir, '/styles.less')
  ];
  return gulp.src(files)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(prefixer({browsers: ['last 4 versions']}))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(concat('app.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(publicStylesDir));
});

gulp.task('styles.vendor', function() {
  var files = [
    path.join(nodeModulesDir, '/font-awesome/css/font-awesome.min.css'),
    path.join(nodeModulesDir, '/os-bootstrap/dist/css/os-bootstrap.min.css'),
    path.join(nodeModulesDir, '/angular/angular-csp.css'),
    path.join(nodeModulesDir, '/typeahead.js-bootstrap-css/typeaheadjs.css'),
    path.join(nodeModulesDir, '/goodtables-ui/dist/goodtables-ui.min.css')
  ];
  return gulp.src(files)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(publicStylesDir));
});

// Assets

gulp.task('assets', [
  'assets.fonts',
  'assets.images',
  'assets.favicon'
]);

gulp.task('assets.fonts', function() {
  var files = [
    path.join(nodeModulesDir, '/font-awesome/fonts/*'),
    path.join(nodeModulesDir, '/os-bootstrap/dist/fonts/*')
  ];
  return gulp.src(files)
    .pipe(gulp.dest(publicFontsDir));
});

gulp.task('assets.images', function() {
  var files = [
    path.join(frontAssetsDir, '/**/*'),
    path.join(nodeModulesDir,
      '/os-bootstrap/dist/assets/os-branding/vector/light/os.svg'),
    path.join(nodeModulesDir,
      '/os-bootstrap/dist/assets/os-branding/vector/light/packager.svg'),
    path.join(nodeModulesDir,
      '/os-bootstrap/dist/assets/os-branding/vector/light/ospackager.svg')
  ];
  return gulp.src(files)
    .pipe(gulp.dest(publicAssetsDir));
});

gulp.task('assets.favicon', function() {
  var files = [
    path.join(nodeModulesDir,
      '/os-bootstrap/dist/assets/os-branding/packager-favicon.ico')
  ];
  return gulp.src(files)
    .pipe(rename('favicon.ico'))
    .pipe(gulp.dest(publicDir));
});
