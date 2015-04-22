;(function(app) {
  'use strict';

  app.controller('uploads.controllers', uploadsControllers);
  
  uploadsControllers.$inject = [ '$http', '$log', '$sessionStorage', 'uploadsUtils', 'FileUploader' ];
  
  function uploadsControllers ($http, $log, $sessionStorage, utils, FileUploader) {
    var vm = this,
        isFileTooBig;

    // Don't let the controller get initialized if no token url was provided
    if ((!vm.getTokenUrl || !vm.getTokenUrl()) && !vm.fetchToken) {
      throw new Error('img-upload directive must be provided a token-url through the eponymous attribute,' +
        ' or a token promise.');
    }

    vm.$storage = $sessionStorage;

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

        // Define policy and signature for AWS upload
        vm.token = token;

        // Use the filename provided by the server if any
        fileItem.file.name = vm.token.filename || fileItem.file.name;

        // Url to hit for the post request
        vm.uploader.url = vm.token.uploadUrl;
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

        vm.uploader.url = vm.token.uploadUrl;
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

    // angular-file-upload callback. This is fired before a file is uploaded
    vm.uploader.onBeforeUploadItem = function(fileItem) {
      // Parse the item stored in session storage
      // before the server upload
      if (!isFileTooBig) {
        fileItem._file = utils.dataURItoBlob(vm.$storage.reader);
      }
    };

    // angular-file-upload callback. This is fired when a file is successfully uploaded to the server.
    // Post a success message to response url to notify the server everything went fine
    vm.uploader.onSuccessItem = function(fileItem, response, status, headers) {
      if (vm.token.responseUrl) {
        $http.post(vm.token.responseUrl, { filename: fileItem.file.name, response: 'success', status: status, headers: headers });
      }
    };

    // angular-file-upload callback. This is fired when a file could not be successfully uploaded to the server.
    // Post an error message to response url to notify the server something went wrong
    vm.uploader.onErrorItem = function(fileItem, response, status, headers) {
      if (vm.token.responseUrl) {
        $http.post(vm.token.responseUrl, { filename: fileItem.file.name, response: 'error', status: status, headers: headers });
      }

      var err = new Error('Could not upload the picture.');
      vm.onUploadFinished(err);
    };

    // angular-file-upload callback. This is fired when an upload is finished, whether it was successful or not.
    vm.uploader.onCompleteItem = function(fileItem, response, status, headers) {
      // Empty the session storage once the item has been uploaded
      delete vm.$storage.reader;

      vm.onUploadFinished(null);
    };
  }

})(angular.module('ng-image-upload.img-upload-ctrl', [
  'angularFileUpload',
  'ngStorage',
  'ng-image-upload.upload-utils'
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
        fetchToken: '=token'
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

      getDimensions: function(canvas, sessionStorage) {
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

          // Stores the img in session storage
          sessionStorage.reader = canvas.toDataURL(type, quality);
        };
      }
    };
  }

})(angular.module('ng-image-upload.upload-utils', [
]));
;;(function (app) {
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
