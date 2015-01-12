(function (app) {
  'use strict';

  app.provider('token', function () {
    var self = this,
        url;

    return {
      setUrl : function(_url) {
        url = _url;
      },

      getUrl : function() {
        return url;
      },

      $get : function($http) {
        if (!url) {
          throw new Error('You must set the token url before attempting to upload a photo.');
        }

        // Request token from server
        return $http.get(url);
      }
    };
  });

})(angular.module('token', []));
