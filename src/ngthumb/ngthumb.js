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
        width: '=?',
        height: '=?',
        fitToContainer: '='
      },
      bindToController: true,
      controllerAs: 'vm',
      controller: ngThumbController,
      template: '<canvas/>',
      link: function (scope, element, attributes) {
        // No thumbnail is added if the browser doesnt support it
        if (!uploadsUtils.checkBrowserCompatibility) {
          return;
        }

        // Check file format - only display the thumbnail if the file actually is an image
        if (!uploadsUtils.isFile(scope.vm.fileItem._file) || !uploadsUtils.isImage(scope.vm.fileItem._file)) {
          return;
        }

        // If the image is to be sized depending on its container, keep its height and width
        if (scope.vm.fitToContainer) {
          scope.vm.width = element[0].clientWidth;
          scope.vm.height = element[0].clientHeight;
        }

        scope.vm.canvas = element.find('canvas');
      }
    };
  }

  function ngThumbController () {
    var vm = this,
        reader = new FileReader();

    reader.onload = onLoadFile;
    reader.readAsDataURL(vm.fileItem._file);

    function onLoadFile (event) {
      var img = new Image();
      img.onload = onLoadImage;
      img.src = event.target.result;
    }

    function onLoadImage () {
      var width, height, maxWidth, maxHeight, heightScaledToWidth, widthScaledToHeight;
      // Use the container's width/height in fitToContainer mode, the passed width and/or height, or the image's own
      // height and width as size targets.
      maxWidth = vm.width || this.width / this.height * vm.height;
      maxHeight = vm.height || this.height / this.width * vm.width;

      // Calculate the height of the image scaled to fit the maximum width, and the width of the image scaled
      // to fit the maximum height.
      heightScaledToWidth = maxWidth / this.width * this.height;
      widthScaledToHeight = maxHeight / this.height * this.width;

      // Only one of the potential scaling ratios can fit in the maximum, use that one for the definitive
      // width and height to set on the canvas.
      if (heightScaledToWidth <= vm.height) {
        width = vm.width;
        height = heightScaledToWidth;
      }

      else if (widthScaledToHeight <= vm.width) {
        width = widthScaledToHeight;
        height = vm.height;
      }

      vm.canvas.attr({ width: width, height: height });
      vm.canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
    }
  }

})(angular.module('ng-image-upload.ngthumb', [
]));
