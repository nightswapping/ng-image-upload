describe('Validate policy token', function () {
  'use strict';

  var validatePolicyToken,
      token;

  beforeEach(module('ng-image-upload.validate-policy-token'));

  beforeEach(inject(function (_validatePolicyToken_) {
    validatePolicyToken = _validatePolicyToken_;

    token = {
      _hidden: 'some randomly added field',
      acl: 'public-read',
      AWSAccessKeyId: 'MyAWSKey',
      key: 'file_key_in_s3',
      policy: 'base64_encoded_policy',
      signature: 'the_policys_hmac_signature',
      url: 'my_s3_buckets_url'
    };
  }));

  it('should throw if any of the required keys is missing from the token', function () {
    expect(function () { validatePolicyToken(_.omit(token, 'acl')); }).toThrow();
    expect(function () { validatePolicyToken(_.omit(token, 'AWSAccessKeyId')); }).toThrow();
    expect(function () { validatePolicyToken(_.omit(token, 'key')); }).toThrow();
    expect(function () { validatePolicyToken(_.omit(token, 'policy')); }).toThrow();
    expect(function () { validatePolicyToken(_.omit(token, 'signature')); }).toThrow();
  });

  it('should throw if any of the required keys is not a string', function () {
    expect(function () { validatePolicyToken(_.assign(token, { acl: {} })); }).toThrow();
    expect(function () { validatePolicyToken(_.assign(token, { AWSAccessKeyId: [] })); }).toThrow();
    expect(function () { validatePolicyToken(_.assign(token, { key: true })); }).toThrow();
    expect(function () { validatePolicyToken(_.assign(token, { policy: 42 })); }).toThrow();
    expect(function () { validatePolicyToken(_.assign(token, { signature: void(0) })); }).toThrow();
  });

  it('should format the token to have only the required keys', function () {
    expect(validatePolicyToken(token)).toEqual({
      acl: 'public-read',
      AWSAccessKeyId: 'MyAWSKey',
      key: 'file_key_in_s3',
      policy: 'base64_encoded_policy',
      signature: 'the_policys_hmac_signature'
    });
  });

});