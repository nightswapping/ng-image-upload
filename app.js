'use strict';


angular
  .module('app', ['angularFileUpload', 'ngStorage'])
  .controller('AppController', [
    '$scope',
    '$log',
    '$sessionStorage',
    'FileUploader',
    function($scope, $log, $sessionStorage, FileUploader) {
      $scope.$storage = $sessionStorage;
      var isFileTooBig;

      var uploader = $scope.uploader = new FileUploader({
        url: 'upload.php'
      });

      // Add the img in session storage once added
      uploader.onAfterAddingFile = function(fileItem) {
        $log.info('onAfterAddingFile', fileItem);
        // TODO: resize/crop the img before storing/upload

        // Check the img can fit into the session storage
        isFileTooBig = fileItem.file.size < 5000000;

        if (isFileTooBig)
          return;
          // TODO: try and compress the img

        var reader = new FileReader();

        // Turns img into a dataUrl so it can
        // be stored in the session storage
        reader.readAsDataURL(fileItem._file);

        // Stores the img in session storage
        // TODO: check the file can fit into the ss
        $scope.$storage.reader = reader;
      };

      uploader.onBeforeUploadItem = function(fileItem) {
        // Parse the item stored in session storage
        // before the server upload

        if (!isFileTooBig)
          fileItem._file = dataURItoBlob($scope.$storage.reader.result);
      };

      uploader.onCompleteItem = function(fileItem, response, status, headers) {
        // Empty the session storage once the item has been uploaded
        delete $scope.$storage.reader;
      };

      uploader.onErrorItem = function(fileItem, response, status, headers) {
        // TODO: try to reupload the img
      };

      // Turns the Data URI into a blob so it
      // can be sent over to the server
      var dataURItoBlob = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var array = [];
        for(var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: mimeString });
      };
    }]);
