'use strict';

var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var prefixer = require('gulp-autoprefixer');

var frontSrcDir = path.join(__dirname, '/fiscal/front');
var frontScriptsDir = path.join(frontSrcDir, '/scripts');
var frontStylesDir = path.join(frontSrcDir, '/styles');

var publicDir = path.join(__dirname, '/fiscal/public');
var publicScriptsDir = path.join(publicDir, '/');
var publicStylesDir = path.join(publicDir, '/');
var publicFontsDir = path.join(publicDir, '/fonts');

var nodeModulesDir = path.join(__dirname, '/node_modules');

gulp.task('default', [
  'app.scripts',
  'app.styles',
  'vendor.scripts',
  'vendor.styles',
  'vendor.fonts'
]);

gulp.task('app.scripts', function() {
  var files = [
    path.join(frontScriptsDir, '/app.js')
  ];
  return gulp.src(files)
    .pipe(concat('app.js'))
    .pipe(gulp.dest(publicScriptsDir));
});

gulp.task('app.styles', function() {
  var files = [
    path.join(frontStylesDir, '/main.css')
  ];
  return gulp.src(files)
    .pipe(prefixer({browsers: ['last 4 versions']}))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(concat('app.css'))
    .pipe(gulp.dest(publicStylesDir));
});

gulp.task('vendor.scripts', function() {
  var files = [
    path.join(nodeModulesDir, '/jquery/dist/jquery.min.js'),
    path.join(nodeModulesDir, '/bootstrap/dist/js/bootstrap.min.js'),
    path.join(nodeModulesDir, '/angular/angular.min.js')
  ];
  return gulp.src(files)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(publicScriptsDir));
});

gulp.task('vendor.styles', function() {
  var files = [
    path.join(nodeModulesDir, '/bootstrap/dist/css/bootstrap.min.css')
  ];
  return gulp.src(files)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(publicStylesDir));
});

gulp.task('vendor.fonts', function() {
  var files = [
    path.join(nodeModulesDir, '/bootstrap/dist/fonts/*')
  ];
  return gulp.src(files)
    .pipe(gulp.dest(publicFontsDir));
});
