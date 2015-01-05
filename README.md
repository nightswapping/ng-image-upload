# imgUpload

A simple directive to upload images to Amazon S3 servers.

The directive follows a very simple flow to work:

1. It requires an AWS token from your server

2. Once provided, it displays an upload form
 
3. Once a picture is added, it resizes it and stores it in session storage if possible
 
4. It uploads it onto AWS S3


### Generating AWS S3 tokens:
Before using the directive, you need to create and configure an Amazon S3 bucket:

1. Create a bucket:
    - Open your AWS account and go to the management console
    - Click on S3
    - Create a new S3 bucket (the name needs to be unique)

2. Configure your bucket:
    - Click on the 'properties' tab for your new bucket
    - Click on 'Add more Permissions'
    - Add 'everyone' as a grantee and check 'list' and 'upload/delete'
    - Click on 'Add CORS configuration' and add the following conf:
 ```xml
    <?xml version="1.0" encoding="UTF-8"?>
      <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <CORSRule>
              <AllowedOrigin>*</AllowedOrigin>
              <AllowedMethod>GET</AllowedMethod>
              <AllowedMethod>POST</AllowedMethod>
              <AllowedMethod>PUT</AllowedMethod>
              <AllowedHeader>*</AllowedHeader>
          </CORSRule>
      </CORSConfiguration>
```

3. Get a policy token:

     You need to provide a policy token to upload file to AWS. The format used for imgUpload is the following:
    ```json
     {
          "expiration": "2020-01-01T00:00:00Z",
          "conditions": [
            {"bucket": "<YOUR BUCKET NAME>"},
            ["starts-with", "$key", ""],
            {"acl": "private"},
            ["starts-with", "$Content-Type", ""],
            ["starts-with", "$filename", ""],
            ["content-length-range", 0, 524288000]
          ]
        }
    ```
    Once edited, base64-encode the policy.

4. Create a signature

    Get your AWS Credentials from the AWS console (id + secret key). Then create an SHA-1 HMAC from your policy using your secret Key.

    Amazon provides some examples in Ruby, Java and Python:
    http://aws.amazon.com/articles/1434/

    Note that for data-centers located in Frankfurt, you need a SHA-256 HMAC and not a SHA-1

5. Provide the signature to the directives

The directive will make a GET Request to your server on the URL you provided it with. You must provide the following items on response:
```json
{
    "AWSKey" : "<YOUR AWS PUBLIC KEY>",
    "policy": "<YOUR BASE-64 ENCODED POLICY>",
    "signature": "<YOUR BASE-64 ENCODED HMAC-SHA1 SIGNATURE>", // HMAC-SHA-256 for Frankfurt
    "url": "https://<YOUR BUCKET NAME>.s3.amazonaws.com/"
}
```

### Directive definition

#### Calling the directive

The directive is defined as a simple element directive:

```html
    <img-upload></img-upload>
```

#### queueLimit (optional, default 1)

Number of picture which can be uploaded

```html
    <img-upload queue-limit='10'></img-upload>
```

#### method (optional, default 'POST')

Http request method used for the upload. Node that AWS only accepts POST's

```html
    <img-upload method='PUT'></img-upload>
```

#### removeAfterUpload (optional, default true)

if true, the picture is removed from the queue and the thumbnail disappears once the upload is complete

```html
    <img-upload remove-after-upload='false'></img-upload>
```

#### acceptAllTypes (optional, default false)

if false, a filter is added to accept only jpg, png, jpeg, bmp and gif files

#### onUploadFinished (optional, default noop)

A callback can be passed to the directive: onUploadFinished is called whenever the upload is done, no matter if it succeeded or not. An error is passed as argument (='null' if success).

```javascript
    <img-upload on-upload-finished='someFunction'></img-upload>
```

### Pass the token Url

The token Url is the url on which the directive will issue a GET request to get the AWSKey, policy, signature and url specified earlier. To pass it to the directive, configure the token provider as follows:

```javascript
  .config(['tokenProvider', function(tokenProvider) {
    tokenProvider.setUrl('token')
  }])
```
