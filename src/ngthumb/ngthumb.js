;(function (app) {
  'use strict';

  // The ngThumb directive extracts the image from the fileItem it gets and draws a thumbnail of it on a canvas
  // Please note that it only works for browsers supporting the HTML5 FileReader API and the Canvas objects
  app.directive('ngThumb', ngThumbDirective);

  ngThumbDirective.$inject = [ 'uploadsUtils' ];
  function ngThumbDirective (uploadsUtils) {
    return {
      restrict: 'A',
      scope: {
        fileItem: '=ngThumb',
        background: '='
      },
      controller: function () {},
      link: function (scope, element, attributes) {

        // No thumbnail is added if the browser doesnt support it
        if (!uploadsUtils.checkBrowserCompatibility) {
          return;
        }

        // Check file format - only display the thumbnail if the file actually is an image
        if (!uploadsUtils.isFile(scope.fileItem._file) || !uploadsUtils.isImage(scope.fileItem._file)) {
          var err = new Error('Attempting to use ngThumbs on a non File/image object');
          err.data = { fileItem: scope.fileItem };
          throw err;
        }

        // Create a reader and setup the callback to set the file as the image's source
        var reader = new FileReader();
        reader.onload = function onLoadFile (event) {
          if (scope.background) {
            // Just set our image as the background of the selected div
            element[0].style['background-image'] = 'url(' + event.target.result + ')';
          }
          
          else {
            // Create an image, give it the correct SRC and insert it into the HTML
            var img = document.createElement('img');
            img.src = event.target.result;
            element.append(img);
          }
        };

        // Trigger the actual file read
        reader.readAsDataURL(scope.fileItem._file);
      }
    };
  }

})(angular.module('ng-image-upload.ngthumb', [
]));
