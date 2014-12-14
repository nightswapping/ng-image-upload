'use strict';

;(function(app) {
  app.controller('uploads.controllers', [
    '$scope',
    '$http',
    '$log',
    '$sessionStorage',
    'FileUploader',
    function($scope, $http, $log, $sessionStorage, FileUploader) {
      $scope.$storage = $sessionStorage;
      $scope.tokenStatus = 'missing';

      var isFileTooBig,
          token;

      // Request token from server
      // (Should probably use 'resolve' from ui-router
      // to load this)
      $http.get('token')
        // If the token is successfully retrieved it will
        // be added to the upload after a file has been added
        .success(function(data) {
          $scope.tokenStatus = 'recieved';
          token = data;
        })
        // If no token has been found and error message
        // is shown on the page and no file can be added
        .error(function() {
        })

      var uploader = $scope.uploader = new FileUploader({
        // Url to hit for the post request
        url: 'upload/',
        // Only one picture should be uploaded
        queueLimit: 1
      });

      // Filters out the items that are not pictures
      uploader.filters.push({
          name: 'imageFilter',
          fn: function(item /*{File|FileLikeObject}*/, options) {
              var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
              return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
      });

      // Add the img in session storage once added
      uploader.onAfterAddingFile = function(fileItem) {
        // Updates the url with the recieved token
        uploader.url = 'upload?t=' + token;

        $log.info('onAfterAddingFile', fileItem);
        // TODO: resize/crop the img before storing/upload

        // Check the img can fit into the session storage
        isFileTooBig = fileItem.file.size < 5000000;

        if (isFileTooBig)
          return;
          // TODO: try and compress the img

        var reader = new FileReader();

        // Turns img into a dataUrl so it can
        // be stored in the session storage
        reader.readAsDataURL(fileItem._file);

        // Stores the img in session storage
        // TODO: check the file can fit into the ss
        $scope.$storage.reader = reader;
      };

      uploader.onBeforeUploadItem = function(fileItem) {
        // Parse the item stored in session storage
        // before the server upload
        if (!isFileTooBig)
          fileItem._file = dataURItoBlob($scope.$storage.reader.result);
      };

      uploader.onCompleteItem = function(fileItem, response, status, headers) {
        // Empty the session storage once the item has been uploaded
        delete $scope.$storage.reader;
      };

      uploader.onErrorItem = function(fileItem, response, status, headers) {
        // TODO: try to reupload the img
      };

      // Turns the Data URI into a blob so it
      // can be sent over to the server
      var dataURItoBlob = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var array = [];

        for(var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }

        return new Blob([ new Uint8Array(array) ], { type: mimeString });
      };
    }]);

})(angular.module('uploads.controllers', ['angularFileUpload', 'ngStorage']))
