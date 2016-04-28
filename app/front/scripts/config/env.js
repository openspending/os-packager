;(function(angular) {

  var services = require('app/services');

  var config = {
    defaultErrorHandler: function(error) {
      if (console.trace) {
        return console.trace(error);
      } else
      if (console.log) {
        return console.log(error);
      }
    },
    defaultPackageFileName: 'datapackage.json',
    events: {
      CONCEPTS_CHANGED: 'package.conceptsChanged'
    },
    storage: {
      collection: 'appstate',
      key: 'default'
    },
    steps: services.data.steps,
    isWizard: window.isWizard,
    maxFileSizeToStore: 100 * 1024 * 1024 // 100Mb
  };

  angular.module('Application')
    .constant('Configuration', config);

})(angular);
