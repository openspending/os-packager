;(function(angular) {

  angular.module('Application')
    .factory('LoginService', [
      'authenticate', 'authorize', '$window', '$rootScope',
      function(authenticate, authorize, $window, $rootScope) {
          var that = this;

          this.reset = function() {
              that.logged_in = false;
              that.name = null;
              that.userid = null;
              that.email = null;
              that.avatar = null;
              that.permissions = null;
              that.permission_token = null;
          };
          this.reset();

          var token = null;
          var registeredEvent = false;
          var attempting = false;
          var href = null;

          this.check = function() {
              var next = $window.location.href;
              var check = authenticate.check(next);
              check.then(function(response) {
                  attempting = false;
                  token = response.token;
                  that.logged_in = true;
                  that.name = response.profile.name;
                  that.email = response.profile.email;
                  that.avatar = response.profile.avatar_url;
                  that.userid = response.profile.idhash;

                  var perm_check = authorize.check(token, 'os.datastore');
                  perm_check.then(function(permission_data) {
                    that.permission_token = permission_data.token;
                    that.permissions = permission_data.permissions;
                  });

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
              authenticate.login( href, '_self' );
          };

          this.logout = function() {
              if ( !that.logged_in ) {
                  return;
              }
              that.reset();

              authenticate.logout();
          };

          return this;
      }
    ]);

})(angular);
