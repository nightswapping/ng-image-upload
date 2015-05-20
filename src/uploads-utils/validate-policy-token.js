(function (app) {
  'use strict';

  app.factory('validatePolicyToken', function () {
    return function (policyToken) {
      // formData holds everything that will be uploaded along the file in the POST request to Amazon S3.
      var formData = {};
      // These are all the necessary fields we will check against and assign on the formData object
      var requiredFields = [ 'acl', 'AWSAccessKeyId', 'key', 'policy', 'signature' ];
      // Intro and outro of the throwing message for each key we will check
      var introMessage = 'The upload token policy must have a string as ',
          outroMessage = ' field. See http://docs.aws.amazon.com/AmazonS3/latest/dev/HTTPPOSTForms.html for more information.';

      // Systematically check and assign all the necessary fields, throw if they are not present or not strings
      // We use a whitelist to make sure any additional data contained in the policy (such as the bucket URL) is not added
      // to the upload, which would cause S3 to reject the request with a 403.
      requiredFields.forEach(function (item, index, array) {
        if (!policyToken[item] || !(typeof policyToken[item] === 'string' || policyToken instanceof String)) {
          throw new Error(introMessage + item + outroMessage);
        }
        formData[item] = policyToken[item];
      });

      return formData;
    };
  });

})(angular.module('ng-image-upload.validate-policy-token', [

]));