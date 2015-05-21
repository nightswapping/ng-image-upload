;(function(app) {
  'use strict';

  app.controller('uploads.controllers', uploadsControllers);
  
  uploadsControllers.$inject = [ '$http', '$log', 'uploadsUtils', 'FileUploader', 'validatePolicyToken' ];
  
  function uploadsControllers ($http, $log, utils, FileUploader, validatePolicyToken) {
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

    // Set uploader method or default to POST
    vm.uploader.method = vm.method || 'POST';

    // Set uploader queue limit or default to 1
    vm.uploader.queueLimit = vm.queueLimit || 1;

    // Remove file from queue, hence from screen, after upload
    vm.uploader.removeAfterUpload = vm.removeAfterUpload || true;

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
          failure(data)
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
        vm.uploader.url = vm.token.url;
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
;;(function (app) {
  'use strict';

  app.directive('imgUpload', imgUploadDirective);

  imgUploadDirective.$inject = [ 'uploadsUtils' ];

  function imgUploadDirective (uploadsUtils) {
    return {
      restrict: 'E',
      scope: {
        queueLimit: '=',
        uploader: '=?',
        sizeLimit: '=',
        removeAfterUpload: '=',
        method: '=',
        acceptAllTypes: '=',
        // onUploadFinished is called when the upload is done. If an error occurred, it is passed as argument
        onUploadFinished: '=?',
        // fetchToken and tokenUrl coexist as alternatives. Either the user can provide an URL and let us fetch 
        // the token ourselves, or they can hand over a function to do it.
        // This second option is more comprehensive as it allows the user to address errors or special cases directly.
        getTokenUrl: '&tokenUrl',
        fetchToken: '=getToken'
      },
      templateUrl: function (elem, attrs) {
        return attrs.templateUrl || 'img-upload/img-upload.tpl.jade';
      },
      controller: 'uploads.controllers',
      controllerAs: 'vm',
      bindToController: true
    };
  }

})(angular.module('ng-image-upload.img-upload-directive', [
  'ng-image-upload.img-upload-ctrl'
]));
;;(function(app) {
  'use strict';

  // The ngThumb directive adds a picture thumbnail to the page
  // Please note that it only works for browsers supporting the
  // HTML5 FileReader API and the Canvas objects
  app.directive('ngThumb', ngThumbDirective);

  ngThumbDirective.$inject = [ 'uploadsUtils' ];

  function ngThumbDirective (uploadsUtils) {
    return {
      restrict: 'A',
      template: '<canvas/>',
      link: function(scope, element, attributes) {
        // No thumbnail is added if the browser doesnt support it
        if (!uploadsUtils.checkBrowserCompatibility) {
          return;
        }

        // Get the params from ng-thumb
        var params = scope.$eval(attributes.ngThumb);

        // Check file format
        if (!uploadsUtils.isFile(params.file) ||
          !uploadsUtils.isImage(params.file)) {
            return;
          }

        var canvas = element.find('canvas');
        var reader = new FileReader();

        reader.onload = onLoadFile;
        reader.readAsDataURL(params.file);

        function onLoadFile(event) {
          var img = new Image();
          img.onload = onLoadImage;
          img.src = event.target.result;
        }

        function onLoadImage() {
          var self = this;
          var width = params.width || self.width / self.height * params.height;
          var height = params.height || self.height / self.width * params.width;

          canvas.attr({ width: width, height: height });
          canvas[0].getContext('2d').drawImage(self, 0, 0, width, height);
        }
      }
    };
  }

})(angular.module('ng-image-upload.ngthumb', [
]));
;;(function(app) {
  'use strict';

  app.factory('uploadsUtils', uploadsUtils);

  uploadsUtils.$inject = [ '$window' ];

  function uploadsUtils ($window) {
    return {
      // Checks if Browser supports the HTML5 FileReader API and Canvas objects
      checkBrowserCompatibility: !!($window.FileReader && $window.CanvasRenderingContext2D),

      // Checks if the given item is a file
      isFile: function(item) {
        return angular.isObject(item) && item instanceof $window.File;
      },

      // Checks if the item is jpg, png, jpeg, bmp or a gif
      isImage: function(file) {
        var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      },

      // Turns the Data URI into a blob so it
      // can be sent over to the server
      dataURItoBlob: function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var array = [];

        for(var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }

        return new Blob([ new Uint8Array(array) ], { type: mimeString });
      },

      getDimensions: function(canvas) {
        // Triggered when the image is loaded to resize if necessary
        return function() {
          var maxHeight = 1600;
          var maxWidth = 2000;
          var quality = 1;
          var type = 'image/jpg';
          var height;
          var width;

          if (this.width > maxWidth) {
            width = maxWidth;
            height = this.height / this.width * maxWidth;
          }

          if (this.height > maxHeight) {
            height = maxHeight;
            width = this.width / this.height * maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          var ctx = canvas.getContext("2d");
          ctx.drawImage(this, 0, 0, width, height);
        };
      }
    };
  }

})(angular.module('ng-image-upload.upload-utils', [
]));
;(function (app) {
  'use strict';

  app.factory('validatePolicyToken', function () {
    return function (policyToken) {
      // formData holds everything that will be uploaded along the file in the POST request to Amazon S3.
      var formData = {};
      // These are all the necessary fields we will check against and assign on the formData object
      var requiredFields = [ 'acl', 'AWSAccessKeyId', 'key', 'policy', 'signature' ];
      // Intro and outro of the throwing message for each key we will check
      var introMessage = 'The upload token policy must have a string as ',
          outroMessage = ' field. See http://docs.aws.amazon.com/AmazonS3/latest/dev/HTTPPOSTForms.html for more information.';

      // Systematically check and assign all the necessary fields, throw if they are not present or not strings
      // We use a whitelist to make sure any additional data contained in the policy (such as the bucket URL) is not added
      // to the upload, which would cause S3 to reject the request with a 403.
      requiredFields.forEach(function (item, index, array) {
        if (!policyToken[item] || !(typeof policyToken[item] === 'string' || policyToken instanceof String)) {
          throw new Error(introMessage + item + outroMessage);
        }
        formData[item] = policyToken[item];
      });

      return formData;
    };
  });

})(angular.module('ng-image-upload.validate-policy-token', [

]));;;(function (app) {
  'use strict';

  return app;

})(
  angular.module('ng-image-upload', [
    'ng-image-upload.img-upload-tpl',
    'ng-image-upload.img-upload-ctrl',
    'ng-image-upload.upload-utils',
    'ng-image-upload.ngthumb',
    'ng-image-upload.img-upload-directive'
  ])
);
;angular.module('ng-image-upload.img-upload-tpl', ['img-upload/img-upload.tpl.jade']);

angular.module("img-upload/img-upload.tpl.jade", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("img-upload/img-upload.tpl.jade",
    "<div nv-file-drop=\"\" uploader=\"vm.uploader\">\n" +
    "  <div class=\"container\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-3\">\n" +
    "        <h3>Select files</h3>\n" +
    "        <div ng-show=\"vm.uploader.isHTML5\">\n" +
    "          <div nv-file-over=\"\" uploader=\"vm.uploader\" class=\"well my-drop-zone\">Base drop zone</div>\n" +
    "        </div>Single\n" +
    "        <input type=\"file\" nv-file-select=\"\" uploader=\"vm.uploader\"/>\n" +
    "      </div>\n" +
    "      <div style=\"margin-bottom: 40px\" class=\"col-md-9\">\n" +
    "        <h2>Files</h2>\n" +
    "        <div ng-repeat=\"item in vm.uploader.queue\">\n" +
    "          <div ng-show=\"vm.uploader.isHTML5\" ng-thumb=\"{ file: item._file, height: 100 }\"></div><strong>{{ item.file.name }}</strong>\n" +
    "          <p ng-show=\"vm.uploader.isHTML5\" nowrap=\"\" style=\"display: inline-block\">{{ item.file.size/1024/1024|number:2 }} MB</p>\n" +
    "        </div>\n" +
    "        <div>\n" +
    "          <button type=\"button\" ng-click=\"vm.uploader.uploadAll()\" ng-disabled=\"!vm.uploader.getNotUploadedItems().length\" class=\"btn btn-success btn-s\">Upload picture</button>\n" +
    "          <button type=\"button\" ng-click=\"vm.uploader.clearQueue()\" ng-disabled=\"!vm.uploader.queue.length\" class=\"btn btn-danger btn-s\">Remove picture</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>");
}]);
