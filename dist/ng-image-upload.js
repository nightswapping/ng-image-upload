;(function(app) {
  'use strict';

  app.controller('uploads.controllers', uploadsControllers);
  
  uploadsControllers.$inject = [ '$http', '$log', '$sessionStorage', 'uploadsUtils', 'FileUploader' ];
  
  function uploadsControllers ($http, $log, $sessionStorage, utils, FileUploader) {
    var vm = this;

    // Don't let the controller get initialized if no token url was provided
    if ((!vm.getTokenUrl || !vm.getTokenUrl()) && !vm.fetchToken) {
      throw new Error('img-upload directive must be provided a token-url through the eponymous attribute,' +
        ' or a token promise.');
    }

    vm.$storage = $sessionStorage;

    var isFileTooBig;

    var uploader = vm.uploader = new FileUploader();

    // Add the img in session storage once added
    uploader.onAfterAddingFile = function(fileItem) {

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
        onUploadFinished: '=',
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
      bindToController: true,
      link: function(scope, element, attributes) {

        // Don't let the directive get initialized if no token url was provided
        if (!scope.getTokenUrl()) {
          throw new Error('img-upload directive must be provided a token-url through the eponymous attribute.');
        }

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
    'ng-image-upload.img-upload-ctrl',
    'ng-image-upload.upload-utils',
    'ng-image-upload.ngthumb',
    'ng-image-upload.img-upload-directive'
  ])
);
