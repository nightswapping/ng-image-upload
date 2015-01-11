describe('Testing Module Definition', function() {

  var module;
    beforeEach(function() {
      module = angular.module("uploads");
    });

    it("should be registered", function() {
      expect(module).not.to.equal(null);
    });

    describe("Dependencies:", function() {

      var deps;
      var hasModule = function(m) {
        return deps.indexOf(m) >= 0;
      };

      beforeEach(function() {
        deps = module.value('uploads').requires;
      });

      //test the module's dependencies
      it("should have ui-router as a dependency", function() {
        expect(hasModule('uploads.templates')).to.be.true;
        expect(hasModule('uploads.controllers')).to.be.true;
        expect(hasModule('uploads.factories')).to.be.true;
        expect(hasModule('uploads.directives')).to.be.true;
        expect(hasModule('ngthumb.directives')).to.be.true;
      });
    });

  //it('should have a properly working VideosCtrl controller', inject(function($rootScope, $controller, $httpBackend) {
    //var searchTestAtr = 'cars';
    //var response = $httpBackend.expectJSONP('https://gdata.youtube.com/feeds/api/videos?q=' + searchTestAtr + '&v=2&alt=json&callback=JSON_CALLBACK');
    //response.respond(null);

    //var $scope = $rootScope.$new();
    //var ctrl = $controller('VideosCtrl', {
      //$scope : $scope,
      //$routeParams : {
        //q : searchTestAtr
      //}
    //});
  //}));

  //it('should have a properly working VideoCtrl controller', inject(function($rootScope, $controller, $httpBackend) {
    //var searchID = 'cars';
    //var response = $httpBackend.expectJSONP('https://gdata.youtube.com/feeds/api/videos/' + searchID + '?v=2&alt=json&callback=JSON_CALLBACK');
    //response.respond(null);

    //var $scope = $rootScope.$new();
    //var ctrl = $controller('VideoCtrl', {
      //$scope : $scope,
      //$routeParams : {
        //id : searchID
      //}
    //});
  //}));

  //it('should have a properly working WatchedVideosCtrl controller', inject(function($rootScope, $controller, $httpBackend) {
    //var $scope = $rootScope.$new();

    ////we're stubbing the onReady event
    //$scope.onReady = function() { };
    //var ctrl = $controller('WatchedVideosCtrl', {
      //$scope : $scope
    //});
  //}));

});
