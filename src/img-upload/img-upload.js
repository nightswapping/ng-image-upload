;(function(app) {
  'use strict';

  app.controller('imgUploadCtrl', imgUploadCtrl)
     .directive('imgUpload', imgUploadDirective);

  function imgUploadDirective (uploadsUtils) {
    return {
      restrict: 'A',
      scope: {
        uploader: '=',
        fetchToken: '=getToken'
      },
      controllerAs: 'vm',
      bindToController: true
    };
  }
  
  imgUploadCtrl.$inject = [ '$http', '$log', 'uploadsUtils', 'FileUploader', 'validatePolicyToken' ];
  function imgUploadCtrl ($http, $log, utils, FileUploader, validatePolicyToken) {
    var vm = this,
        isFileTooBig;

    // Don't let the controller get initialized if no token url or token getter function was provided
    if ((!vm.getTokenUrl || !vm.getTokenUrl()) && !vm.fetchToken) {
      throw new Error('img-upload directive must be provided either a token-url through the eponymous attribute,' +
        ' or a token getter function through get-token.');
    }

    // Make sure we can use this callback safely
    vm.onUploadFinished = vm.onUploadFinished || angular.noop;

    /**
     * Initialize and configure a file uploader
     */
    vm.uploader = new FileUploader();

    // Set up filters to check that images should be uploaded before uploading them
    // Filters out the items that are not pictures
    function imageFilter (item /*{File|FileLikeObject}*/, options) {
      var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
      if ('|jpg|png|jpeg|bmp|gif|'.indexOf(type) === -1) {
        var err = new Error('File extension not supported (' + type + ')');
        vm.onUploadFinished(err);
        throw err;
      }

      return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
    }

    // Filters out images that are larger than the specified or default limit
    function sizeFilter (item /*{File|FileLikeObject}*/, options) {
      var size = item.size,
          // Use passed size limit or default to 10MB
          sizeLimit = vm.sizeLimit || 10 * 1000 * 1000;
      if (size > sizeLimit) {
        var err = new Error('File too big (' + size + ')');
        vm.onUploadFinished(err);
        throw err;
      }
      return size < sizeLimit;
    }

    // Add our new filters to the uploader's filter list if applicable
    vm.uploader.filters.push({ name: 'sizeFilter', fn: sizeFilter });
    if (!vm.acceptAllTypes) {
      vm.uploader.filters.push({ name: 'imageFilter', fn: imageFilter });
    }

    /**
     * Define the uploader's callbacks during upload cyclce
     */

    // angular-file-upload callback. This is fired when a single file is added to the queue.
    // Add the img in session storage once added
    vm.uploader.onAfterAddingFile = function(fileItem) {

      var canvas = document.createElement('canvas');

      // The token should be a JSON object containing the bucket URL, the filename to upload to, the AWS key,
      // the policy that authorizes the upload and its signature (see the docs) 
      // We get it throught the passed function, or from the server at the URL provided to the directive
      (vm.fetchToken || function httpFetchToken (postData, success, failure) {
        $http.post(vm.getTokenUrl(), postData)
        .success(function _success (data) {
          success(data);
        })
        .error(function _failure (data) {
          failure(data);
        });
      })
      ({ filename: fileItem.file.name }, function success (token) {
        var formData;

        // Assign the token to the controller, check and clean it to add it to the form that we will post to amazon.
        vm.token = token;
        formData = validatePolicyToken(vm.token);

        // Add the content-type header to the form that will be sent to S3
        formData['Content-Type'] = (fileItem.file.type !== '') ? fileItem.file.type : 'application/octet-stream';

        // The data that will be sent to S3 along with the file. It contains the data in the policy token and the Content-Type
        fileItem.formData.push(formData);

        // The URL we will be uploading to. This should be the S3 bucket's URL
        fileItem.url = vm.token.url;
        
        var reader = new FileReader();

        // Turns img into a dataUrl so it can
        // be stored in the session storage
        reader.readAsDataURL(fileItem._file);
        reader.onload = onLoad;

        // To resize the picture we need a hidden canvas
        // to draw a new pic with the expected dimensions
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);

      }, function failure (error) {
        throw new Error(error);
      });
      // Wait for the reader to be loaded to get the right img.src
      function onLoad(event) {
        var img = new Image();
        img.onload = utils.getDimensions(canvas, vm.$storage);
        img.src = event.target.result;
      }
    };

    // angular-file-upload callback. This is fired when a file is successfully uploaded to the server.
    vm.uploader.onSuccessItem = function(fileItem, response, status, headers) {
      // There's no error to transmit. Pass the policy token so the consumer can figure out which upload finished
      vm.onUploadFinished(null, fileItem.formData[0]);
    };

    // angular-file-upload callback. This is fired when a file could not be successfully uploaded to the server.
    vm.uploader.onErrorItem = function(fileItem, response, status, headers) {
      // The upload failed. Pass the error and transmit as much information as possible
      vm.onUploadFinished(new Error(fileItem.formData[0].key +
       ' could not be uploaded to Amazon S3. Status: ' + status + ' ' + response));
    };
  }

})(angular.module('ng-image-upload.img-upload-ctrl', [
  'angularFileUpload',
  'ng-image-upload.upload-utils',
  'ng-image-upload.validate-policy-token'
]));
