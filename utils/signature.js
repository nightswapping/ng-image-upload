var sha1   = require('./sha1.js');

function getSignature(secret) {
  var POLICY_JSON = {
      "expiration": "2020-01-01T00:00:00Z",
      "conditions": [
        {"bucket": "angularupload"},
        ["starts-with", "$key", ""],
        {"acl": "private"},
        ["starts-with", "$Content-Type", ""],
        ["starts-with", "$filename", ""],
        ["content-length-range", 0, 524288000]
      ]
    }

  return sha1.b64_hmac_sha1(encodeURIComponent(secret), JSON.stringify(POLICY_JSON));
}

module.exports = getSignature;
