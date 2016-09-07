'use strict';

var _ = require('lodash');
var utils = require('../../../services/utils');

angular.module('Application')
  .factory('PreviewDataService', [
    'PackageService',
    function(PackageService) {
      var result = {};

      var state = {};
      state.selectedPossibility = null;

      var possibilities = utils.availablePossibilities;

      result.getState = function() {
        return state;
      };

      result.getPossibilities = function() {
        return possibilities;
      };

      //result.getPreviewData = function() {
      //  return utils.getDataForPreview(
      //    PackageService.getResources(), 10);
      //};

      result.update = function() {
        var resources = PackageService.getResources();
        _.each(possibilities, function(possibility) {
          possibility.update(resources);
        });
        if (state.selectedPossibility) {
          var possibility = _.find(possibilities, {
            id: state.selectedPossibility
          });
          if (!possibility || !possibility.isAvailable) {
            possibility = _.find(possibilities, {
              isAvailable: true
            });
            result.selectPossibility(possibility);
          }
        }
      };

      result.selectPossibility = function(possiblity) {
        state.selectedPossibility = null;
        if (_.isObject(possiblity)) {
          possiblity = _.find(possibilities, {id: possiblity.id});
          if (_.isObject(possiblity) && possiblity.isAvailable) {
            state.selectedPossibility = possiblity.id;
            state.graph = possiblity.graph;
          }
        }
      };

      return result;
    }
  ]);
