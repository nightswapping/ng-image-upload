;(function(app) {
  'use strict';

  app.controller('uploads.controllers', uploadsControllers);
  
  uploadsControllers.$inject = [ '$http', '$log', '$sessionStorage', 'uploadsUtils', 'FileUploader' ];
  
  function uploadsControllers ($http, $log, $sessionStorage, utils, FileUploader) {
    var vm = this;

    vm.$storage = $sessionStorage;

    var isFileTooBig;

    var uploader = vm.uploader = new FileUploader();

    // Add the img in session storage once added
    uploader.onAfterAddingFile = function(fileItem) {

      var canvas = document.createElement('canvas');

      // The token should be a JSON object containing the bucket URL, the filename to upload to, the AWS key,
      // the policy that authorizes the upload and its signature (see the docs) 
      // We get it from the server at the URL provided to the directive
      $http.post(vm.getTokenUrl(), { filename: fileItem.file.name })
      .success(function success (token) {

        // Define policy and signature for AWS upload
        vm.token = token;

        // Use the filename provided by the server if any
        fileItem.file.name = vm.token.filename || fileItem.file.name;

        // Url to hit for the post request
        uploader.url = vm.token.uploadUrl;
        fileItem.url = vm.token.uploadUrl;

        // Updates the formData for Amazon AWS S3 Upload
        fileItem.formData.push({
          key:  fileItem.file.name,
          AWSAccessKeyId: vm.token.AWSKey,
          acl: 'private',
          'Content-Type': (fileItem.file.type !== '') ? fileItem.file.type : 'application/octet-stream',
          filename: vm.token.filename,
          policy: vm.token.policy,
          signature: vm.token.signature
        });

        var reader = new FileReader();

        // Turns img into a dataUrl so it can
        // be stored in the session storage
        reader.readAsDataURL(fileItem._file);
        reader.onload = onLoad;

        try {
          vm.$storage.reader = reader;
        } catch(e) {
          isFileTooBig = true;
          throw new Error(e);
        }

        // To resize the picture we need a hidden canvas
        // to draw a new pic with the expected dimensions
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);

        uploader.url = vm.token.uploadUrl;
      })
      .error(function failure (error) {
        throw new Error(error);
      });
      // Wait for the reader to be loaded to get the right img.src
      function onLoad(event) {
        var img = new Image();
        img.onload = utils.getDimensions(canvas, vm.$storage);
        img.src = event.target.result;
      }
    };

    uploader.onBeforeUploadItem = function(fileItem) {
      // Parse the item stored in session storage
      // before the server upload
      console.log(fileItem);
      if (!isFileTooBig) {
        fileItem._file = utils.dataURItoBlob(vm.$storage.reader);
      }
    };

    // Post a success message to response url to notify the server
    // everything went fine
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
      if (vm.token.responseUrl) {
        $http.post(vm.token.responseUrl, { filename: fileItem.file.name, response: 'success', status: status, headers: headers });
      }
    };

    // Post an error message to response url to notify the server
    // something went wrong
    uploader.onErrorItem = function(fileItem, response, status, headers) {
      if (vm.token.responseUrl) {
        $http.post(vm.token.responseUrl, { filename: fileItem.file.name, response: 'error', status: status, headers: headers });
      }
    };
  }

})(angular.module('ng-image-upload.img-upload-ctrl', [
  'angularFileUpload',
  'ngStorage',
  'ng-image-upload.upload-utils'
]));
