;(function (app) {
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
