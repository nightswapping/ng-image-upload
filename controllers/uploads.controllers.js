'use strict';

;(function(app) {
  app
  .config(['tokenProvider', function(tokenProvider) {
    tokenProvider.setUrl('token')
  }])
  .controller('uploads.controllers', [
    '$scope',
    '$http',
    '$log',
    '$sessionStorage',
    'token',
    'uploadsUtils',
    'FileUploader',
    function($scope, $http, $log, $sessionStorage, _token, utils, FileUploader) {
      $scope.$storage = $sessionStorage;
      $scope.tokenStatus = 'missing';

      // token should be a JSON object containing the Policy and Signature
      // which are part of the tokens for AWS Uploads
      var token,
          isFileTooBig;

      var uploader = $scope.uploader = new FileUploader();


      _token.success(function(data) {
        $scope.tokenStatus = 'received'
        // Define policy and signature for AWS upload
        token = data;

        // Url to hit for the post request
        uploader.url = token.url;
      })
      .error(function() {
        throw new Error('Couldn\'t retreive AWS credentials');
      })

      // Add the img in session storage once added
      uploader.onAfterAddingFile = function(fileItem) {
        // Updates the formData for Amazon AWS S3 Upload
        fileItem.formData.push({
          key:  fileItem.file.name,
          AWSAccessKeyId: token.AWSKey,
          acl: 'private',
          'Content-Type': (fileItem.file.type !== '') ? fileItem.file.type : 'application/octet-stream',
          filename: fileItem.file.name,
          policy: token.policy,
          signature: token.signature
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

})(angular.module('uploads.controllers', ['token', 'angularFileUpload', 'ngStorage']))
