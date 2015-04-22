;(function (app) {
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
