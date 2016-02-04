;(function(angular) {

  angular.module('Application')
    .controller('LoginHeader', [
      'LoginService',
      function(loginService) {
          this.svc = loginService;
      }
    ]);

})(angular);
