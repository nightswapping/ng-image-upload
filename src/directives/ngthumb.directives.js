;(function(app) {
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
