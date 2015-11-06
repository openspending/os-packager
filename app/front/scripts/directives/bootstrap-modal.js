;(function(angular) {

  var events = {
    MODAL_OPEN: 'bootstrap-modal.open',
    MODAL_CLOSE: 'bootstrap-modal.close'
  };

  angular.module('Application')
    .directive('bootstrapModal', [
      function() {
        return {
          restrict: 'A',
          link: function($scope, element) {
            $scope.$on(events.MODAL_OPEN, function(event, modalId) {
              if (element.attr('id') == modalId) {
                element.modal('show');
              }
            });
            $scope.$on(events.MODAL_CLOSE, function(event, modalId) {
              if (element.attr('id') == modalId) {
                element.modal('hide');
              }
            });
          }
        };
      }
    ])
    .run([
      '$rootScope',
      function($rootScope) {
        $rootScope.bootstrapModal = function() {
          var $scope = this;
          return {
            show: function(modalId) {
              $scope.$broadcast(events.MODAL_OPEN, [modalId]);
            },
            hide: function(modalId) {
              $scope.$broadcast(events.MODAL_CLOSE, [modalId]);
            }
          };
        };
      }
    ]);

})(angular);
