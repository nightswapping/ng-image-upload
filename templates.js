angular.module('uploads.templates', ['../templates/imgupload.tpl.jade']);

angular.module("../templates/imgupload.tpl.jade", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../templates/imgupload.tpl.jade",
    "<div nv-file-drop=\"\" uploader=\"uploader\">\n" +
    "  <div ng-switch=\"tokenStatus\" class=\"container\">\n" +
    "    <div ng-switch-when=\"received\" class=\"row\">\n" +
    "      <div class=\"col-md-3\">\n" +
    "        <h3>Select files</h3>\n" +
    "        <div ng-show=\"uploader.isHTML5\">\n" +
    "          <div nv-file-over=\"\" uploader=\"uploader\" class=\"well my-drop-zone\">Base drop zone</div>\n" +
    "        </div>Single\n" +
    "        <input type=\"file\" nv-file-select=\"\" uploader=\"uploader\"/>\n" +
    "      </div>\n" +
    "      <div style=\"margin-bottom: 40px\" class=\"col-md-9\">\n" +
    "        <h2>Files</h2>\n" +
    "        <div ng-repeat=\"item in uploader.queue\">\n" +
    "          <div ng-show=\"uploader.isHTML5\" ng-thumb=\"{ file: item._file, height: 100 }\"></div><strong>{{ item.file.name }}</strong>\n" +
    "          <p ng-show=\"uploader.isHTML5\" nowrap=\"\" style=\"display: inline-block\">{{ item.file.size/1024/1024|number:2 }} MB</p>\n" +
    "        </div>\n" +
    "        <div>\n" +
    "          <button type=\"button\" ng-click=\"uploader.uploadAll()\" ng-disabled=\"!uploader.getNotUploadedItems().length\" class=\"btn btn-success btn-s\">Upload picture</button>\n" +
    "          <button type=\"button\" ng-click=\"uploader.clearQueue()\" ng-disabled=\"!uploader.queue.length\" class=\"btn btn-danger btn-s\">Remove picture</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"missing\" class=\"row\">\n" +
    "      <div class=\"col-md-12\">\n" +
    "        <h1>No token has been received</h1>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>");
}]);
