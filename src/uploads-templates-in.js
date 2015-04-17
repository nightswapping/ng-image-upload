;(function (app) {
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
