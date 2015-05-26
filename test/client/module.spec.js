xdescribe('Testing Module Definition', function() {

  var $http,
      $rootScope,
      vm,
      token,
      tokenProviderTester,
      fileItem,
      fetchToken = jasmine.createSpy();

  beforeEach(module('ng-image-upload'));

  beforeEach(inject(function ($compile, _$rootScope_, _$http_) {
    var scope, element;

    $http = _$http_;
    $rootScope = _$rootScope_;

    token = {
      acl: 'public-read',
      AWSAccessKeyId: 'foo',
      key: 'bar',
      policy: 'fizz',
      signature: 'buzz',
      url: 'https://example.com'
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

    scope = $rootScope.$new();
    scope.tokenUrl = function () { return 'token-url'; }

    element = '<img-upload token-url="tokenUrl"></img-upload>';
    element = $compile(element)(scope);
    scope.$apply();

    vm = element.isolateScope().vm;
  }));

  describe('Configure states', function () {

    it('should assign the token and set the tokenStatus as "ok" after the token has been received', function () {
      var dummy = vm.uploader.FileItem = fileItem;
      vm.uploader.onAfterAddingFile(dummy)

      expect(vm.token).toEqual(token);
    });

    it('should add the file to the uploader queue', function () {
      var dummy = vm.uploader.FileItem = fileItem;

      vm.uploader.queue.push(dummy);
      $rootScope.$apply()

      expect(vm.uploader.queue.length).toEqual(1)
    });

    it('should update the formData with the token', function () {
      var dummy = vm.uploader.FileItem = fileItem;

      vm.uploader.queue.push(dummy);
      vm.uploader.onAfterAddingFile(dummy)

      $rootScope.$apply()
      expect(dummy.formData.length).toEqual(1)
      expect(dummy.formData[0].acl).toEqual('public-read')
      expect(dummy.formData[0].AWSAccessKeyId).toEqual('foo')
      expect(dummy.formData[0].key).toEqual('bar')
      expect(dummy.formData[0].policy).toEqual('fizz')
      expect(dummy.formData[0].signature).toEqual('buzz')
    });

    it('creates a hidden canvas element on the DOM', function () {
      var dummy = vm.uploader.FileItem = fileItem;

      vm.uploader.queue.push(dummy);
      vm.uploader.onAfterAddingFile(dummy)
      $rootScope.$apply()
      var canvas = document.querySelector('canvas')
      expect(canvas).toBeTruthy();
      expect(canvas.getAttribute('style')).toEqual('visibility: hidden;')
    });

    it('uploads the file properly', function () {
      var dummy = vm.uploader.FileItem = fileItem;

      vm.uploader.queue.push(dummy);
      vm.uploader.onAfterAddingFile(dummy)
      $rootScope.$apply()

      vm.uploader.uploadAll();
      expect(fileItem._prepareToUploading).toHaveBeenCalled();
      expect(fileItem.upload).toHaveBeenCalled();
    });
  });
});
