'use strict';

;(function(app) {
  app.directive('imgUpload', ['uploadsUtils', function(uploadsUtils) {
    return {
      restrict: 'E',
      scope: {
        queueLimit: '=',
        removeAfterUpload: '=',
        method: '='
      },
      templateUrl: '../templates/imgupload.tpl.jade',
      controller: 'uploads.controllers',
      link: function(scope, element, attributes) {

        // Only one picture should be uploaded
        scope.uploader.queueLimit = scope.queueLimit || 1;
        // Remove file from queue, hence on screen, after upload
        scope.uploader.removeAfterUpload = scope.removeAfterUpload || true;
        scope.uploader.method = scope.method || 'POST';

        // Filters out the items that are not pictures
        scope.uploader.filters.push({
          name: 'imageFilter',
          fn: function(item /*{File|FileLikeObject}*/, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            if ('|jpg|png|jpeg|bmp|gif|'.indexOf(type) === -1)
              throw new Error('File extension not supported (' + type + ')');

            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
        });
      }
    };
  }]);
})(angular.module('uploads.directives', ['uploads.controllers']))
