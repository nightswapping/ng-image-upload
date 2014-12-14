'use strict';

;(function(app) {
  app.directive('ngThumb', ['$window', 'uploadsUtils', function($window, uploadsUtils) {
    return {
      restrict: 'A',
      template: '<canvas/>',
      link: function(scope, element, attributes) {
        if (!uploadUtils.support) return;

        var params = scope.$eval(attributes.ngThumb);

        if (!uploadUtils.isFile(params.file)) return;
        if (!uploadUtils.isImage(params.file)) return;

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
          var width = params.width || this.width / this.height * params.height;
          var height = params.height || this.height / this.width * params.width;
          canvas.attr({ width: width, height: height });
          canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
        }
      }
    };
  }]);
})(angular.module('uploads.directives'))
