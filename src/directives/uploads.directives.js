;(function(app) {
  'use strict';

  app.directive('imgUpload', ['uploadsUtils', function(uploadsUtils) {
    return {
      restrict: 'E',
      scope: {
        queueLimit: '=',
        sizeLimit: '=',
        removeAfterUpload: '=',
        method: '=',
        onUploadFinished: '='
      },
      templateUrl: 'templates/imgupload.tpl.jade',
      controller: 'uploads.controllers',
      link: function(scope, element, attributes) {

        // onUploadFinished is called when the uplad is done
        // an error is passed as args if an error happened
        var onUploadFinished = scope.onUploadFinished || function() {};

        scope.uploader.method = scope.method || 'POST';
        // Only one picture should be uploaded
        scope.uploader.queueLimit = scope.queueLimit || 1;
        // File max size accepted
        var sizeLimit = scope.sizeLimit || 10000000;
        // Remove file from queue, hence on screen, after upload
        scope.uploader.removeAfterUpload = scope.removeAfterUpload || true;

        // Filters out the items that are not pictures
        if (!attributes.hasOwnProperty('acceptAllTypes')) {
          scope.uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
              var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
              if ('|jpg|png|jpeg|bmp|gif|'.indexOf(type) === -1) {
                var err = new Error('File extension not supported (' + type + ')');
                onUploadFinished(err);
                throw err;
              }

              return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
          });
        }

        scope.uploader.filters.push({
          name: 'sizeFilter',
          fn: function(item /*{File|FileLikeObject}*/, options) {
            var size = item.size;
            if (size > sizeLimit) {
              var err = new Error('File too big (' + size + ')');
              onUploadFinished(err);
              throw err;
            }
            return size < sizeLimit;
          }
        });

        scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
          // Empty the session storage once the item has been uploaded
          delete scope.$storage.reader;

          onUploadFinished(null);
        };

        scope.uploader.onErrorItem = function(fileItem, response, status, headers) {
          var err = new Error('Couldn\'t not upload the picture');
          onUploadFinished(err);
        };
      }
    };
  }]);
})(angular.module('uploads.directives', ['uploads.controllers']));
