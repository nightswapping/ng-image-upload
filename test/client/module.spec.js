describe('Testing Module Definition', function() {

  var $http,
      scope,
      ctrl,
      token,
      tokenProviderTester,
      fileItem,
      fetchToken = jasmine.createSpy();

  beforeEach(module('uploads.controllers'));

  beforeEach(inject(function ($rootScope, $controller, _$http_) {
    $http = _$http_;
    scope = $rootScope.$new();

    scope.getTokenUrl = function () {
      return 'token-url';
    };

    token = {
      url: 'foo',
      AWSKey: 'bar',
      policy: 'fiz',
      signature: 'buz'
    };

    fileItem = {
      lastModifiedDate: new Date(),
      size: 1e6,
      type: 'image/jpeg',
      name: 'test_file_name',
      formData: [],
      file: {
        name: 'foobar'
      },
      _file: new Blob(),
      _prepareToUploading: jasmine.createSpy(),
      upload: jasmine.createSpy()
    };

    spyOn($http, 'post').and.callFake(function (fileName) {
      return {
        success: jasmine.createSpy().and.callFake(function (callback) {
          callback(token);
          return { error: function () {} };
        })
      };
    });

    ctrl = $controller('uploads.controllers', {$scope: scope, tokenProvider: tokenProviderTester});
  }));

  describe('Configure states', function () {

    it('should assign the token and set the tokenStatus as "ok" after the token has been received', function () {
      var dummy = scope.uploader.FileItem = fileItem;
      scope.uploader.onAfterAddingFile(dummy)

      expect(scope.token).toEqual(token);
    });

    it('should add the file to the uploader queue', function () {
      var dummy = scope.uploader.FileItem = fileItem;

      scope.uploader.queue.push(dummy);
      scope.$apply()

      expect(scope.uploader.queue.length).toEqual(1)
    });

    it('should update the formData with the token', function () {
      var dummy = scope.uploader.FileItem = fileItem;

      scope.uploader.queue.push(dummy);
      scope.uploader.onAfterAddingFile(dummy)

      scope.$apply()
      expect(dummy.formData.length).toEqual(1)
      expect(dummy.formData[0].key).toEqual('foobar')
      expect(dummy.formData[0].AWSAccessKeyId).toEqual('bar')
      expect(dummy.formData[0].acl).toEqual('private')
    });

    it('creates a hidden canvas element on the DOM', function () {
      var dummy = scope.uploader.FileItem = fileItem;

      scope.uploader.queue.push(dummy);
      scope.uploader.onAfterAddingFile(dummy)
      scope.$apply()
      var canvas = document.querySelector('canvas')
      expect(canvas).toBeTruthy();
      expect(canvas.getAttribute('style')).toEqual('visibility: hidden;')
    });

    it('uploads the file properly', function () {
      var dummy = scope.uploader.FileItem = fileItem;

      scope.uploader.queue.push(dummy);
      scope.uploader.onAfterAddingFile(dummy)
      scope.$apply()

      scope.uploader.uploadAll();
      expect(fileItem._prepareToUploading).toHaveBeenCalled();
      expect(fileItem.upload).toHaveBeenCalled();
    });
  });
});
