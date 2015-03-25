;(function(app) {
  'use strict';

  app.controller('uploads.controllers',
    ['$scope', '$http', '$log', '$sessionStorage', 'token', 'uploadsUtils', 'FileUploader',
    function($scope, $http, $log, $sessionStorage, fetchToken, utils, FileUploader) {
      $scope.$storage = $sessionStorage;
      $scope.tokenStatus = 'ok';

      // token should be a JSON object containing the Policy and Signature
      // which are part of the tokens for AWS Uploads
      $scope.token = {};
      var isFileTooBig;

      var uploader = $scope.uploader = new FileUploader();

      // Add the img in session storage once added
      uploader.onAfterAddingFile = function(fileItem) {
        var canvas = document.createElement('canvas');
        fetchToken(fileItem.file.name).success(function(data) {
          console.log(data);
          $scope.tokenStatus = 'ok';

          // Define policy and signature for AWS upload
          $scope.token = data;

          // Use the filename provided by the server if any
          fileItem.file.name = $scope.token.filename || fileItem.file.name;

          // Url to hit for the post request
          uploader.url = $scope.token.uploadUrl;
          fileItem.url = $scope.token.uploadUrl;

          // Updates the formData for Amazon AWS S3 Upload
          fileItem.formData.push({
            key:  fileItem.file.name,
            AWSAccessKeyId: $scope.token.AWSKey,
            acl: 'private',
            'Content-Type': (fileItem.file.type !== '') ? fileItem.file.type : 'application/octet-stream',
            filename: $scope.token.filename,
            policy: $scope.token.policy,
            signature: $scope.token.signature
          });

          var reader = new FileReader();

          // Turns img into a dataUrl so it can
          // be stored in the session storage
          reader.readAsDataURL(fileItem._file);
          reader.onload = onLoad;

          try {
            $scope.$storage.reader = reader;
          } catch(e) {
            isFileTooBig = true;
            throw new Error(e);
          }

          // To resize the picture we need a hidden canvas
          // to draw a new pic with the expected dimensions
          canvas.style.visibility = 'hidden';
          document.body.appendChild(canvas);

          uploader.url = $scope.token.uploadUrl;
        })
        .error(function() {
          $scope.tokenStatus = 'missing';
          throw new Error('Couldn\'t retreive AWS credentials');
        });
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
        console.log(fileItem);
        if (!isFileTooBig) {
          fileItem._file = utils.dataURItoBlob($scope.$storage.reader);
        }
      };

      // Post a success message to response url to notify the server
      // everything went fine
      uploader.onSuccessItem = function(fileItem, response, status, headers) {
        if ($scope.token.responseUrl) {
          $http.post($scope.token.responseUrl, { filename: fileItem.file.name, response: 'success', status: status, headers: headers });
        }
      };

      // Post an error message to response url to notify the server
      // something went wrong
      uploader.onErrorItem = function(fileItem, response, status, headers) {
        if ($scope.token.responseUrl) {
          $http.post($scope.token.responseUrl, { filename: fileItem.file.name, response: 'error', status: status, headers: headers });
        }
      };
    }]);

})(angular.module('uploads.controllers', ['token', 'angularFileUpload', 'ngStorage']));
