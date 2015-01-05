'use strict';

;(function(app) {
  app.directive('imgUpload', ['uploadsUtils', function(uploadsUtils) {
    return {
      restrict: 'E',
      scope: {
        queueLimit: '=',
        removeAfterUpload: '=',
        method: '=',
        onUploadFinished: '='
      },
      templateUrl: '../templates/imgupload.tpl.jade',
      controller: 'uploads.controllers',
      link: function(scope, element, attributes) {

        var onUploadFinished = scope.onUploadFinished || function() {}

        scope.uploader.method = scope.method || 'POST';
        // Only one picture should be uploaded
        scope.uploader.queueLimit = scope.queueLimit || 1;
        // Remove file from queue, hence on screen, after upload
        scope.uploader.removeAfterUpload = attributes.hasOwnProperty('removeAfterUpload');

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

        scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
          // Empty the session storage once the item has been uploaded
          delete scope.$storage.reader;

          onUploadFinished(null);
        };

        scope.uploader.onErrorItem = function(fileItem, response, status, headers) {
          var err = new Error('Couldn\'t not upload the picture')
          onUploadFinished(err)
        };
      }
    };
  }]);
})(angular.module('uploads.directives', ['uploads.controllers']))
