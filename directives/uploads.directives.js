'use strict';

;(function(app) {
  app.directive('imgUpload', ['uploadsUtils', function(uploadsUtils) {
    return {
      restrict: 'E',
      templateUrl: '../templates/imgupload.tpl.jade',
      controller: 'uploads.controllers',
      link: function(scope, element, attributes) {

      }
    };
  }]);
})(angular.module('uploads.directives', ['uploads.controllers']))
