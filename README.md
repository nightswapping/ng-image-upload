# imgUpload

[ ![ng-image-upload master](https://codeship.com/projects/58520180-890e-0132-21fc-7a1f56d80b92/status?branch=master)](https://codeship.com/projects/59578)

A simple directive to upload images to Amazon S3 servers.

The directive follows a very simple flow to work:

1. It requires an AWS token from your server

2. Once provided, it displays an upload form

3. Once a picture is added, it resizes it and stores it in session storage if possible

4. It uploads it onto AWS S3

### Dependencies:

imgUpload uses 3 dependencies which needs to be loaded before usage:
- [AngularJs] (https://github.com/angular/angular.js)
- [angular-file-upload] (https://github.com/nervgh/angular-file-upload)
- [ngStorage] (https://github.com/gsklee/ngStorage)

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

The directive will make an HTTP POST Request to your server on the URL you provided it with. The request provides the item `filename` so you can modify it to normalize your items name or leave it as it is.

You must provide the following items on response:
```json
{
    "AWSKey" : "<YOUR AWS PUBLIC KEY>",
    "policy": "<YOUR BASE-64 ENCODED POLICY>",
    "signature": "<YOUR BASE-64 ENCODED HMAC-SHA1 SIGNATURE>", // HMAC-SHA-256 for Frankfurt
    "filename": <the item filename>, (optional - you can modify the item file name or leave it as it is)
    "uploadUrl": "https://<YOUR BUCKET NAME>.s3.amazonaws.com/",
    "responseUrl": "<your response url>", (optional - only if you want to receive the response from AWS)
}
```
If you are using AWS or a thier hosting service, you'll likely want to get notified of the upload result. To do so, just pass a `responseUrl` parameter. A post request will be issued to this url with the following parameter.
```json
{
  filename: <the filname just uploaded>,
  response: 'success' || 'error',
  status: <the HTTP response status code>
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

#### sizeLimit (optional, default 10mo)

Limit to the size of the file to be uploaded in octets.

```html
    <img-upload size-limit='8000000'></img-upload>
```

#### method (optional, default 'POST')

Http request method used for the upload. Note that AWS only accepts POST's

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

### Using the default template 

To use the default template, simply pick up `dist/ng-image-upload-template-in.js` and use the directive. It will automatically use the default template.

### Using a custom template

The directive comes in 2 distributions : with a default template for the interface, and without it. If you want to use your own template, simply pick up `dist/ng-image-upload.js` and pass your template's URL (or its address in templateCache) to the directive as an attribute.

```html
<img-upload template-url="app/templates/image-upload.tpl.jade"></img-upload>
```

__Alternative method:__

You can also use your own template by putting it inside the templateCache in the place the directive expects it to be by default: `img-upload/img-upload.tpl.jade`. This trick works for both distributions and allows you to use the same template wherever you use the directive in your app.

```javascript
$templateCache.put('img-upload/img-upload.tpl.jade', 'This is the content of the template');
```

### Demo

The project contains a simple example to see the directive in action.
To get it working add a secret.js (or .json) file in the example folder with your AWS credentials so they can be passed onto the directive. Then simply run ```node example/server.js``` to access it on port 3000.

The secret.js file looks like this:

```javascript
module.exports.token = {
  AWSKey : 'AKRllRIlRllRKKNSDFAS',
  policy:
    'efdsfKKKfdsffdsLLfdsff92fds23fsljfsdfsdfsdflfds00DBaIiwKICAiY29uZGl0aW9uc' +
    'yI6IFsKICAgIHsiYnVjasaq22ogImFuZ3VsYfdsfdsvYWQifSdsfdsfIFsic3RhcnRzLXdpdG' +
    'giLCAiJGtleSIsICIiXSwKICAfdLsiYWNsIjogInByaXZhdGUifSwKICAgIFsic3RhcnRzLXd' +
    'pdGgiLCAiJENvbnRlbnQtVHlwZSIfdaAiXSwKICAgIFsic3RhcnRzLXdpdGgiLCAiJGZpbGVu' +
    'YW1lf1wgIiJdLAogICAgWyJjb250ZW504Wxlbmd0aC1yYW5nZSIsIDAsIDUyNDI4ODAwMF0KI' +
    'CBdCfds',
  signature: 'SFDFDsaa0923rfdfdsfsdfuBq0c=',
  url: 'https://<YOUR BUCKET NAME>.s3.amazonaws.com/'
}
```
