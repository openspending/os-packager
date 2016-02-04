;(function(angular) {

  angular.module('Application')
    .factory('LoginService', [
      'authenticate', '$window', '$rootScope',
      function(authenticate, $window, $rootScope) {
          var that = this;

          this.logged_in = false;
          this.name = null;
          this.email = null;
          this.avatar = null;

          var token = null;
          var registeredEvent = false;
          var attempting = false;
          var href = null;

          this.check = function() {
              var next = $window.location.origin+'/login-success';
              var check = authenticate.check(next);
              check.then(function(response) {
                  attempting = false;
                  token = response.token;
                  that.logged_in = true;
                  that.name = response.profile.name;
                  that.email = response.profile.email;
                  that.avatar = response.profile.avatar_url;
              }, function(providers) {
                  if ( !registeredEvent ) {
                      $window.addEventListener('focus', function() {
                          if ( !that.logged_in && attempting ) {
                              that.check();
                          }
                      });
                      registeredEvent = true;
                  }
                  href = providers.google.url;
              });
          };
          this.check();

          this.login = function() {
              if ( that.logged_in || href == null ) {
                  return true;
              }
              attempting = true;
              authenticate.login( href,  '_blank' );
          }

          return this;
      }
    ]);

})(angular);
