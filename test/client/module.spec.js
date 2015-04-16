describe('Testing Module Definition', function() {

  var token = {
    url: 'foo',
    AWSKey: 'bar',
    policy: 'fiz',
    signature: 'buz'
  }

  var fileItem = {
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
  }

  var tokenProviderTester;
  var q, deferred, mockTokenProviderGet, scope, ctrl;
  var counter;

  beforeEach(module('uploads'))

  beforeEach(
    module('uploads', function(tokenProvider) {
      counter = 0;

      tokenProvider.$get = function() {
        var fake = {
          success: function(fn) {
            counter++;
            fn(token);
            var mock = function() {}
            mock.error = function() {}
            return mock },
        };
        return fake;
      }

      tokenProviderTester = tokenProvider
    })
  );

  beforeEach(inject(function () {}));

  describe('Configure states', function () {

    beforeEach(inject(function($rootScope, $controller, $q) {
      tokenProviderTester.setUrl('test-route')
      scope = $rootScope.$new();
      q = $q;
      ctrl = $controller('uploads.controllers', {$scope: scope, tokenProvider: tokenProviderTester});
    }));

    it('set the token-url in config phase', function () {
      expect(tokenProviderTester.getUrl()).toEqual('test-route')
    });

    it('should have call fetchToken.sucess', function () {
      expect(counter).toEqual(1)
    });

    it('should set the tokenStatus as "received" after the token has been received', function () {
      expect(scope.tokenStatus).toEqual('received')
    });

    it('initially sets the tokenStatus as "received"', function () {
      expect(scope.token.url).toEqual('foo')
      expect(scope.token.AWSKey).toEqual('bar')
      expect(scope.token.policy).toEqual('fiz')
      expect(scope.token.signature).toEqual('buz')
    });

    it('add file to the uploader queue', function () {
      var dummy = scope.uploader.FileItem = fileItem;

      scope.uploader.queue.push(dummy);
      scope.$apply()
      expect(scope.uploader.queue.length).toEqual(1)
    });

    it('updates the formData with the token', function () {
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
      expect(canvas).not.to.be.null
      expect(canvas.getAttribute('style')).toEqual('visibility: hidden;')
    });

    it('uploads the file properly', function () {
      var dummy = scope.uploader.FileItem = fileItem;

      scope.uploader.queue.push(dummy);
      scope.uploader.onAfterAddingFile(dummy)
      scope.$apply()

      scope.uploader.uploadAll();
      expect(fileItem._prepareToUpload).toHaveBeenCalled();
      expect(fileItem.upload).toHaveBeenCalled();
    });
  });
});
