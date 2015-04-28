'use strict';

/**
 * @ngdoc object
 *
 * @name stormpath.SpStateConfig:SpStateConfig
 *
 * @property {boolean} authenticate
 *
 * If `true`, the user must be authenticated in order to view this state.
 * If the user is not authenticated, they will
 * be redirected to the `login` state.  After they login, they will be redirected to
 * the state that was originally requested.
 *
 * @property {object} authorize
 *
 * An object that defines access control rules.  Currently, it supports a group-based
 * check.  See the example below.
 *
 * @property {boolean} waitForUser
 *
 * If `true`, delay the state transition until we know
 * if the user is authenticated or not.  This is useful for situations where
 * you want everyone to see this state, but the state may look different
 * depending on the user's authentication state.
 *
 *
 * @description
 *
 * The Stormpath State Config is an object that you can define on a UI Router
 * state.  Use this configuration to define access control for your routes, as
 * defined by UI Router.
 *
 * You will need to be using the UI Router module, and you need
 * to enable the integration by calling
 * {@link stormpath.$stormpath#methods_uiRouter $stormpath.uiRouter()} in your
 * application's config block.
 *
 * This configuration does not support Angular's built-in `$routeProvider` at
 * this time, we will add this in a future version.
 *
 * **NOTE:** Do not define this configuration on a abstract state, it must go on
 * the child state.  However, the controller of the abstract state will be
 * initialized AFTER any configuration rules of the child state have been met.
 *
 * @example
 *
 * <pre>
 *
 * angular.module('myApp')
 *   .config(function ($stateProvider) {
 *
 *     // Wait until we know if the user is logged in before showing the homepage
 *     $stateProvider
 *       .state('main', {
 *         url: '/',
 *         sp: {
 *           waitForUser: true
 *         }
 *       });
 *
 *     // Require a user to be authenticated in order to see this state
 *     $stateProvider
 *       .state('secrets', {
 *         url: '/secrets',
 *         controller: 'SecretsCtrl',
 *         sp: {
 *           authenticate: true
 *         }
 *       });
 *
 *     // Require a user to be in the admins group in order to see this state
 *     $stateProvider
*       .state('secrets', {
 *         url: '/admin',
 *         controller: 'AdminCtrl',
 *         sp: {
 *           authorize: {
 *             group: 'admins'
 *           }
 *         }
 *       });
 * });
 * </pre>
 */
angular.module('stormpath',['stormpath.CONFIG','stormpath.auth','stormpath.userService'])
.provider('$stormpath', [function $stormpathProvider(){
  /**
   * @ngdoc object
   *
   * @name stormpath.$stormpath
   *
   * @description
   *
   * This service allows you to enable application-wide features of the library.
   */

  this.$get = [
    '$user','$state','$cookieStore','STORMPATH_CONFIG','$rootScope',
    function stormpathServiceFactory($user,$state,$cookieStore,STORMPATH_CONFIG,$rootScope){

      function StormpathService(){
        var encoder = new UrlEncodedFormParser();
        this.encodeUrlForm = encoder.encode.bind(encoder);
        return this;
      }
      function stateChangeUnauthenticatedEvent(toState, toParams){
        /**
         * @ngdoc event
         * @name stormpath.$stormpath#$stateChangeUnauthenticated
         * @eventOf stormpath.$stormpath
         * @eventType broadcast on root scope
         * @param {Object} toState The state that the user attempted to access.
         * @param {Object} toParams The state params of the state that the user
         * attempted to access.
         *
         * @description
         *
         * This event is broadcast when a UI state change is prevented,
         * because the user is not logged in.
         *
         * Use this event if you want to implement your own strategy for
         * presenting the user with a login form.
         *
         * To receive this event, you must be using the UI Router integration.
         *
         * @example
         * <pre>
         *   $rootScope.$on('$stateChangeUnauthenticated',function(e,toState,toParams){
         *     // Your custom logic for deciding how the user should login, and
         *     // if you want to redirect them to the desired state afterwards
         *   });
         * </pre>
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHENTICATED,toState,toParams);
      }
      function stateChangeUnauthorizedEvent(toState,toParams){
        /**
         * @ngdoc event
         * @name stormpath.$stormpath#$stateChangeUnauthorized
         * @eventOf stormpath.$stormpath
         * @eventType broadcast on root scope
         * @param {Object} toState The state that the user attempted to access.
         * @param {Object} toParams The state params of the state that the user
         * attempted to access.
         *
         * @description
         *
         * This event is broadcast when a UI state change is prevented,
         * because the user is not authorized by the rules defined in the
         * {@link stormpath.SpStateConfig:SpStateConfig Stormpath State Configuration}
         * for the requested state.
         *
         * Use this event if you want to implement your own strategy for telling
         * the user that they are forbidden from viewing that state.
         *
         * To receive this event, you must be using the UI Router integration.
         *
         * @example
         * <pre>
         *   $rootScope.$on('$stateChangeUnauthorized',function(e,toState,toParams){
         *     // Your custom logic for deciding how the user should be
         *     // notified that they are forbidden from this state
         *   });
         * </pre>
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHORIZED,toState,toParams);
      }
      StormpathService.prototype.stateChangeInterceptor = function stateChangeInterceptor() {
        $rootScope.$on('$stateChangeStart', function(e,toState,toParams){
          var sp = toState.sp || {}; // Grab the sp config for this state

          if((sp.authenticate || sp.authorize) && (!$user.currentUser)){
            e.preventDefault();
            $user.get().then(function(){
              // The user is authenticated, continue to the requested state
              if(sp.authorize){
                if(authorizeStateConfig(sp)){
                  $state.go(toState.name,toParams);
                }else{
                  stateChangeUnauthorizedEvent(toState,toParams);
                }
              }else{
                $state.go(toState.name,toParams);
              }
            },function(){
              // The user is not authenticated, emit the necessary event
              stateChangeUnauthenticatedEvent(toState,toParams);
            });
          }else if(sp.waitForUser && ($user.currentUser===null)){
            e.preventDefault();
            $user.get().finally(function(){
              $state.go(toState.name,toParams);
            });
          }
          else if($user.currentUser && sp.authorize){

            if(!authorizeStateConfig(sp)){
              e.preventDefault();
              stateChangeUnauthorizedEvent(toState,toParams);
            }

          }
        });
      };

      function authorizeStateConfig(spStateConfig){
        var sp = spStateConfig;
        if(sp && sp.authorize && sp.authorize.group) {
          return $user.currentUser.inGroup(sp.authorize.group);
        }else{
          console.error('Unknown authorize configuration for spStateConfig',spStateConfig);
          return false;
        }

      }

      /**
       * @ngdoc function
       *
       * @name stormpath#uiRouter
       *
       * @methodOf stormpath.$stormpath
       *
       * @param {object} config
       *
       * * **`autoRedirect`** - Defaults to true.  After the user logs in at
       * the state defined by `loginState`, they will be redirected back to the
       * state that was originally requested.
       *
       * * **`defaultPostLoginState`**  - Where the user should be sent, after login,
       * if they have visited the login page directly.  If you do not define a value,
       * nothing will happen at the login state.  You can alternatively use the
       * {@link stormpath.authService.$auth#events_$authenticated $authenticated} event to know
       * that login is successful.
       *
       * * **`forbiddenState`** - The UI state name that we should send the user
       * to if they try to an access a view that they are not authorized to view.
       * This happens in response to an `authorize` rule in one of your
       * {@link stormpath.SpStateConfig:SpStateConfig Stormpath State Configurations}
       *
       * * **`loginState`** - The UI state name that we should send the user
       * to if they need to login.  You'll probably use `login` for this value.
       *
       * @description
       *
       * Call this method to enable the integration with the UI Router module.
       *
       * When enabled, you can define {@link stormpath.SpStateConfig:SpStateConfig Stormpath State Configurations} on your UI states.
       * This object allows you to define access control for the state.  See the
       * examples below.
       *
       * @example
       *
       * <pre>
       * angular.module('myApp')
       *   .run(function($stormpath){
       *     $stormpath.uiRouter({
       *       forbiddenState: 'forbidden',
       *       defaultPostLoginState: 'main',
       *       loginState: 'login'
       *     });
       *   });
       * </pre>
       */
      StormpathService.prototype.uiRouter = function uiRouter(config){
        var self = this;
        config = typeof config === 'object' ? config : {};
        this.stateChangeInterceptor();

        if(config.loginState){
          self.unauthenticatedWather = $rootScope.$on(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHENTICATED,function(e,toState,toParams){
            self.postLogin = {toState:toState,toParams:toParams};
            $state.go(config.loginState);
            if(config.autoRedirect !== false){
              self.authWatcher = $rootScope.$on(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,function(){
                self.authWatcher(); // unregister this watcher
                if(self.postLogin){
                  $state.go(self.postLogin.toState,self.postLogin.toParams).then(function(){
                    self.postLogin = null;
                  });
                }
              });
            }
          });
        }
        if(config.forbiddenState){
          self.forbiddenWatcher = $rootScope.$on(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHORIZED,function(){
            $state.go(config.forbiddenState);
          });
        }
        if(config.defaultPostLoginState){
          self.defaultRedirectStateWatcher = $rootScope.$on(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,function(){
            if(!self.postLogin){
              $state.go(config.defaultPostLoginState);
            }
          });
        }
      };

      StormpathService.prototype.regexAttrParser = function regexAttrParser(value){
        var expr;
        if(value instanceof RegExp){
          expr = value;
        }else if(value && /^\/.+\/[gim]?$/.test(value)){
          expr = new RegExp(value.split('/')[1],value.split('/')[2]);
        }else{
          expr = value;
        }
        return expr;
      };

      function UrlEncodedFormParser(){

        // Copy & modify from https://github.com/hapijs/qs/blob/master/lib/stringify.js

        this.delimiter = '&';
        this.arrayPrefixGenerators = {
          brackets: function (prefix) {
            return prefix + '[]';
          },
          indices: function (prefix, key) {
            return prefix + '[' + key + ']';
          },
          repeat: function (prefix) {
            return prefix;
          }
        };
        return this;
      }
      UrlEncodedFormParser.prototype.stringify = function stringify(obj, prefix, generateArrayPrefix) {

        if (obj instanceof Date) {
          obj = obj.toISOString();
        }
        else if (obj === null) {
          obj = '';
        }

        if (typeof obj === 'string' ||
          typeof obj === 'number' ||
          typeof obj === 'boolean') {

          return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
        }

        var values = [];

        if (typeof obj === 'undefined') {
          return values;
        }

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          if (Array.isArray(obj)) {
            values = values.concat(this.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix));
          }
          else {
            values = values.concat(this.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix));
          }
        }

        return values;
      };
      UrlEncodedFormParser.prototype.encode = function encode(obj, options) {

        options = options || {};
        var delimiter = typeof options.delimiter === 'undefined' ? this.delimiter : options.delimiter;

        var keys = [];

        if (typeof obj !== 'object' ||
          obj === null) {

          return '';
        }

        var arrayFormat;
        if (options.arrayFormat in this.arrayPrefixGenerators) {
          arrayFormat = options.arrayFormat;
        }
        else if ('indices' in options) {
          arrayFormat = options.indices ? 'indices' : 'repeat';
        }
        else {
          arrayFormat = 'indices';
        }

        var generateArrayPrefix = this.arrayPrefixGenerators[arrayFormat];

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          keys = keys.concat(this.stringify(obj[key], key, generateArrayPrefix));
        }

        return keys.join(delimiter);
      };

      return new StormpathService();
    }
  ];
}])
.run(['$rootScope','$user','STORMPATH_CONFIG',function($rootScope,$user,STORMPATH_CONFIG){
  $rootScope.user = $user.currentUser || null;
  $user.get().finally(function(){
    $rootScope.user = $user.currentUser;
  });
  $rootScope.$on(STORMPATH_CONFIG.GET_USER_EVENT,function(){
    $rootScope.user = $user.currentUser;
  });
  $rootScope.$on(STORMPATH_CONFIG.SESSION_END_EVENT,function(){
    $rootScope.user = $user.currentUser;
  });
}])

/**
 * @ngdoc directive
 *
 * @name stormpath.ifUser:ifUser
 *
 * @description
 *
 * Use this directive to conditionally show an element if the user is logged in.
 *
 * @example
 *
 * <pre>
 * <div class="container">
 *   <h3 if-user>Hello, {{user.fullName}}</h3>
 * </div>
 * </pre>
 */
.directive('ifUser',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(user){
        if(user && user.href){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 *
 * @name stormpath.ifNotUser:ifNotUser
 *
 * @description
 *
 * Use this directive to conditionally show an element if the user is NOT logged in.
 *
 * @example
 *
 * <pre>
 * <div class="container">
 *   <h3 if-not-user>Hello, you need to login</h3>
 * </div>
 * </pre>
 */
.directive('ifNotUser',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(user){
        if(user && user.href){
          element.hide();
        }else{
          element.show();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 *
 * @name stormpath.ifUserInGroup:ifUserInGroup
 *
 * @description
 *
 * Use this directive to conditionally show an element if the user is logged in
 * and is a member of the group that is specified by the expression.
 *
 * The attribute value MUST be one of:
 *
 * * A string expression, surrounded by quotes
 * * A reference to a property on the $scope.  That property can be a string or
 * regular expression.
 *
 * # Using Regular Expressions
 *
 * If using a string expression as the attribute value, you can pass a regular
 * expression by wrapping it in the literal
 * syntax, e.g.
 *  * `'/admins/'` would match any group which has *admins* in the name
 *  * `'/admin$/'` would match any group were the name **ends with** *admin*
 *
 * If referencing a scope property, you should create the value as a RegExp type,
 * e.g.:
 *
 *  <pre>
 *    $scope.matchGroup = new RegExp(/admins/);
 *  </pre>
 *
 * All regular expressions are evaluated via
 * [RegExp.prototype.test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)
 *
 * @example
 *
 * <pre>
 *   <script type="text/javascript">
 *     function SomeController($scope){
 *       $scope.matchGroup = /admins/;
 *     }
 *   <script>
 *   <div ng-controller="SomeController">
 *     <h3 if-user-in-group="'admins'">
 *       Hello, {{user.fullName}}, you are an administrator
 *     </h3>
 *
 *     <div if-user-in-group="'/admins/'">
 *        <!-- would match any group which has *admins* in the name -->
 *     </div>
 *     <div if-user-in-group="matchGroup">
 *        <!-- equivalent to the last example -->
 *     </div>
 *     <div if-user-in-group="'/admin$/'">
 *        <!-- would match any group were the name **ends with** *admin* -->
 *     </div>
 *   </div>
 * </pre>
 */
.directive('ifUserInGroup',['$user','$rootScope','$parse','$stormpath',function($user,$rootScope,$parse,$stormpath){

  return {
    link: function(scope,element,attrs){

      var expr;
      var attrExpr = attrs.ifUserInGroup;

      function evalElement(){
        var user = $user.currentUser;
        if(user && user.groupTest(expr)){
          element.show();
        }else{
          element.hide();
        }
      }

      if(attrExpr){
        scope.$watch($parse(attrExpr),function(value){
          expr = $stormpath.regexAttrParser(value);
          evalElement();
        });
        $rootScope.$watch('user',function(){
          evalElement();
        });
      }
    }
  };
}])

/**
 * @ngdoc directive
 *
 * @name stormpath.ifUserNotInGroup:ifUserNotInGroup
 *
 * @description
 *
 * Use this directive to conditionally show an element if the user is logged in
 * and is NOT a member of the group that is specified by the expression.
 *
 * This is the inverse of {@link stormpath.ifUserInGroup:ifUserInGroup ifUserInGroup},
 * please refer to that directive for full usage information.
 *
 * @example
 *
 * <pre>
 *   <div class="container">
 *     <h3 if-user-not-in-group="'admins'">
 *       Hello, {{user.fullName}}, please request administrator access
 *     </h3>
 *   </div>
 * </pre>
 */
.directive('ifUserNotInGroup',['$user','$rootScope','$parse','$stormpath',function($user,$rootScope,$parse,$stormpath){
  return {
    link: function(scope,element,attrs){

      var expr;
      var attrExpr = attrs.ifUserNotInGroup;

      function evalElement(){
        var user = $user.currentUser;
        if(user && user.groupTest(expr)){
          element.hide();
        }else{
          element.show();
        }
      }

      if(attrExpr){
        scope.$watch($parse(attrExpr),function(value){
          expr = $stormpath.regexAttrParser(value);
          evalElement();
        });
        $rootScope.$watch('user',function(){
          evalElement();
        });
      }
    }
  };
}])

/**
 * @ngdoc directive
 *
 * @name stormpath.whileResolvingUser:while-resolving-user
 *
 * @description
 *
 * # [DEPRECATED]
 * Please use {@link stormpath.ifUserStateUnknown:ifUserStateUnknown ifUserStateUnknown} instead.
 *
 */
.directive('whileResolvingUser',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(){
        if($user.currentUser || ($user.currentUser===false)){
          element.hide();
        }else{
          element.show();
        }
      });
    }
  };
}])
/**
 * @ngdoc directive
 *
 * @name stormpath.ifUserStateKnown:ifUserStateKnown
 *
 * @description
 *
 * Use this directive to show an element once the user state is known.
 * The inverse of {@link stormpath.ifUserStateUnknown:ifUserStateUnknown ifUserStateUnknown}. You can
 * use this directive to show an element after we know if the user is logged in
 * or not.
 *
 * @example
 *
 * <pre>
 * <div if-user-state-known>
 *   <li if-not-user>
 *      <a ui-sref="login">Login</a>
 *    </li>
 *    <li if-user>
 *        <a ui-sref="main" sp-logout>Logout</a>
 *    </li>
 * </div>
 * </pre>
 */
.directive('ifUserStateKnown',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(){
        if($user.currentUser || ($user.currentUser===false)){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])
/**
 * @ngdoc directive
 *
 * @name stormpath.ifUserStateUnknown:ifUserStateUnknown
 *
 * @description
 *
 * Use this directive to show an element while waiting to know if the user
 * is logged in or not.  This is useful if you want to show a loading graphic
 * over your application while you are waiting for the user state.
 *
 * @example
 *
 * <pre>
 * <div if-user-state-unknown>
 *   <p>Loading.. </p>
 * </div>
 * </pre>
 */
.directive('ifUserStateUnknown',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(){
        if($user.currentUser === null){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 *
 * @name stormpath.spLogout:spLogout
 *
 * @description
 *
 * This directive adds a click handler to the element.  When clicked, the user will be logged out.
 *
 * @example
 *
 * <pre>
 *   <a ui-sref="main" sp-logout>Logout</a>
 * </pre>
 */
.directive('spLogout',['$auth',function($auth){
  return{
    link: function(scope,element){
      element.on('click',function(){
        $auth.endSession();
      });
    }
  };
}]);