;(function(angular) {

  var _ = require('underscore');

  var steps = [
    {
      id: 'upload-file',
      order: 1,
      title: 'Provide your data'
    },
    {
      id: 'describe-data',
      order: 2,
      title: 'Describe your data'
    },
    {
      id: 'metadata',
      order: 3,
      title: 'Provide metadata'
    },
    {
      id: 'download',
      order: 4,
      title: 'Confirm and download'
    }
  ];

  angular.module('Application')
    .factory('StepsService', [
      '$q',
      function($q) {
        return {
          getSteps: function() {
            return $q(function(resolve, reject) {
              resolve(steps);
            });
          },
          getNextStep: function(steps, step) {
            if (!!steps && _.isObject(step)) {
              var isFound = false;
              return _.find(steps, function(item) {
                if (item.id == step.id) {
                  isFound = true;
                  return false;
                }
                return isFound;
              });
            }
          }
        };
      }
    ]);

})(angular);
