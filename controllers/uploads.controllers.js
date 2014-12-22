'use strict';

;(function(app) {
  app.controller('uploads.controllers', [
    '$scope',
    '$http',
    '$log',
    '$sessionStorage',
    'uploadsUtils',
    'FileUploader',
    function($scope, $http, $log, $sessionStorage, utils, FileUploader) {
      $scope.$storage = $sessionStorage;
      $scope.tokenStatus = 'missing';

      // Policy and Signature are part of the tokens for AWS Uploads
      var AWSKey,
          policy,
          signature;

      var isFileTooBig,
          token;

      // Request token from server
      // (Should probably use 'resolve' from ui-router
      // to load this)
      $http.get('token')
        .success(function(data) {
          // If the token is successfully retrieved it will
          // be added to the upload after a file has been added
          $scope.tokenStatus = 'received';

          // Define policy and signature for AWS upload
          AWSKey = data.AWSKey;
          policy = data.policy;
          signature = data.signature;
        })
        // If no token has been found an error message
        // is shown on the page and no file can be added
        .error(function() {
          throw new Error('Couldn\'t retreive AWS credentials');

          $scope.tokenStatus = 'missing';
        })

      var uploader = $scope.uploader = new FileUploader({
        // Url to hit for the post request
        url: 'https://angularupload.s3.amazonaws.com/',
        // Only one picture should be uploaded
        queueLimit: 1,
        // Remove file from queue, hence on screen, after upload
        removeAfterUpload: true,
        method: 'POST'
      });

      // Filters out the items that are not pictures
      uploader.filters.push({
        name: 'imageFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          if ('|jpg|png|jpeg|bmp|gif|'.indexOf(type) === -1)
            throw new Error('File extension not supported (' + type + ')');

          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      });

      // Add the img in session storage once added
      uploader.onAfterAddingFile = function(fileItem) {
        // Updates the formData for Amazon AWS S3 Upload
        fileItem.formData.push({
          key:  fileItem.file.name,
          AWSAccessKeyId: AWSKey,
          acl: 'private',
          'Content-Type': (fileItem.file.type !== '') ? fileItem.file.type : 'application/octet-stream',
          filename: fileItem.file.name,
          policy: policy,
          signature: signature
        });

        // Check the img can fit into the session storage
        isFileTooBig = fileItem.file.size > 5000000;

        // TODO: check once the picture has been resized
        // rather than here
        if (isFileTooBig)
          return;

        var reader = new FileReader();

        // Turns img into a dataUrl so it can
        // be stored in the session storage
        reader.readAsDataURL(fileItem._file);
        reader.onload = onLoad;

        // To resize the picture we need a hidden canvas
        // to draw a new pic with the expected dimensions
        var canvas = document.createElement('canvas');
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);

        // Wait for the reader to be loaded to get the right img.src
        function onLoad(event) {
          var img = new Image();
          img.onload = utils.getDimensions(canvas, $scope.$storage);
          img.src = event.target.result;
        }
      };

      uploader.onBeforeUploadItem = function(fileItem) {
        // Parse the item stored in session storage
        // before the server upload
        if (!isFileTooBig)
          fileItem._file = utils.dataURItoBlob($scope.$storage.reader);
      };

      uploader.onCompleteItem = function(fileItem, response, status, headers) {
        // Empty the session storage once the item has been uploaded
        delete $scope.$storage.reader;
      };

      uploader.onErrorItem = function(fileItem, response, status, headers) {
        // TODO: try to reupload the img
      };
    }]);

})(angular.module('uploads.controllers', ['angularFileUpload', 'ngStorage']))
