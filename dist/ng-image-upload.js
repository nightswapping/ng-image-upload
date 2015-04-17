angular.module('uploads.templates', ['templates/imgupload.tpl.jade']);

angular.module("templates/imgupload.tpl.jade", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/imgupload.tpl.jade",
    "<div nv-file-drop=\"\" uploader=\"uploader\">\n" +
    "  <div class=\"container\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-3\">\n" +
    "        <h3>Select files</h3>\n" +
    "        <div ng-show=\"uploader.isHTML5\">\n" +
    "          <div nv-file-over=\"\" uploader=\"uploader\" class=\"well my-drop-zone\">Base drop zone</div>\n" +
    "        </div>Single\n" +
    "        <input type=\"file\" nv-file-select=\"\" uploader=\"uploader\"/>\n" +
    "      </div>\n" +
    "      <div style=\"margin-bottom: 40px\" class=\"col-md-9\">\n" +
    "        <h2>Files</h2>\n" +
    "        <div ng-repeat=\"item in uploader.queue\">\n" +
    "          <div ng-show=\"uploader.isHTML5\" ng-thumb=\"{ file: item._file, height: 100 }\"></div><strong>{{ item.file.name }}</strong>\n" +
    "          <p ng-show=\"uploader.isHTML5\" nowrap=\"\" style=\"display: inline-block\">{{ item.file.size/1024/1024|number:2 }} MB</p>\n" +
    "        </div>\n" +
    "        <div>\n" +
    "          <button type=\"button\" ng-click=\"uploader.uploadAll()\" ng-disabled=\"!uploader.getNotUploadedItems().length\" class=\"btn btn-success btn-s\">Upload picture</button>\n" +
    "          <button type=\"button\" ng-click=\"uploader.clearQueue()\" ng-disabled=\"!uploader.queue.length\" class=\"btn btn-danger btn-s\">Remove picture</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>");
}]);
;(function (app) {
  'use strict';

  app.provider('token', function () {
    var self = this,
        url;

    return {
      setUrl : function(_url) {
        url = _url;
      },

      getUrl : function() {
        return url;
      },

      $get : function($http) {
        return function(filename) {
          if (!url) {
            throw new Error('You must set the token url before attempting to upload a photo.');
          }

          // Request token from server
          return $http.post(url, { filename: filename });
        };
      }
    };
  });

})(angular.module('token', []));
;;(function(app) {
  'use strict';

  app.controller('uploads.controllers',
    ['$scope', '$http', '$log', '$sessionStorage', 'token', 'uploadsUtils', 'FileUploader',
    function($scope, $http, $log, $sessionStorage, fetchToken, utils, FileUploader) {
      $scope.$storage = $sessionStorage;

      var isFileTooBig;

      var uploader = $scope.uploader = new FileUploader();

      // Add the img in session storage once added
      uploader.onAfterAddingFile = function(fileItem) {

        var canvas = document.createElement('canvas');
        // The token should be a JSON object containing the bucker URL, the filename to upload to, the AWS key,
        // the policy that authorizes the upload and its signature (see the docs) 
        fetchToken(fileItem.file.name).success(function(token) {
          $scope.tokenStatus = 'ok';

          // Define policy and signature for AWS upload
          $scope.token = token;

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
;;(function(app) {
  'use strict';

  app.factory('uploadsUtils', ['$window', function($window) {
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
  }]);
})(angular.module('uploads.factories', []));
;;(function(app) {
  'use strict';
  // The ngThumb directive adds a picture thumbnail to the page
  // Please note that it only works for browsers supporting the
  // HTML5 FileReader API and the Canvas objects
  app.directive('ngThumb', ['uploadsUtils', function(uploadsUtils) {
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
  }]);
})(angular.module('ngthumb.directives', []));
;;(function(app) {
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
;;(function (app) {
  'use strict';

  return app;

})(
  angular.module('uploads', [
    'uploads.templates',
    'uploads.controllers',
    'uploads.factories',
    'ngthumb.directives',
    'uploads.directives'
  ])
);
