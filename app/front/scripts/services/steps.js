;(function(angular) {

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
          }
        };
      }
    ]);

})(angular);
