;(function(angular) {

  angular.module('Application')
    .factory('LoginService', [
      '_', 'authenticate', 'authorize', '$window', '$location',
      function(_, authenticate, authorize, $window, $location) {
        var that = this;

        $window.addEventListener('message', function(event) {
          if (_.isObject(event.data)) {
            if (event.data.message == 'OSLoginWindow.LoginFinished') {
              that.check();
            }
          }
        }, false);

        this.reset = function() {
          that.isLoggedIn = false;
          that.name = null;
          that.userId = null;
          that.email = null;
          that.avatar = null;
          that.permissions = null;
          that.permissionToken = null;
        };
        this.reset();

        var token = null;
        var isEventRegistered = false;
        var attempting = false;
        var href = null;

        this.check = function() {
          var protocol = $location.protocol() + '://';
          var host = $location.host();
          var port = $location.port() == '80' ? '' :
            ':' + $location.port();
          var url = '/logged-in';

          var next = protocol + host + port + url;

          var check = authenticate.check(next);
          check.then(function(response) {
            attempting = false;
            token = response.token;
            that.isLoggedIn = true;
            that.name = response.profile.name;
            that.email = response.profile.email;
            // jscs:disable
            that.avatar = response.profile.avatar_url;
            // jscs:enable
            that.userId = response.profile.idhash;

            authorize.check(token, 'os.datastore')
              .then(function(permissionData) {
                that.permissionToken = permissionData.token;
                that.permissions = permissionData.permissions;
              });
          })
          .catch(function(providers) {
            if (!isEventRegistered) {
              $window.addEventListener('focus', function() {
                if (!that.isLoggedIn && attempting) {
                  that.check();
                }
              });
              isEventRegistered = true;
            }
            href = providers.google.url;
          });
        };
        this.check();

        this.login = function() {
          if (that.isLoggedIn || (href === null)) {
            return true;
          }
          attempting = true;
          authenticate.login(href, 'OS_Login');
        };

        this.logout = function() {
          if (that.isLoggedIn) {
            that.reset();
            authenticate.logout();
          }
        };

        return this;
      }
    ]);

})(angular);
