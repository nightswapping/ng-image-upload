# ng-image-upload

[ ![ng-image-upload master](https://codeship.com/projects/58520180-890e-0132-21fc-7a1f56d80b92/status?branch=master)](https://codeship.com/projects/59578)

**A simple directive to upload images to Amazon S3 servers.**

It follows a very straightforward workflow:

1. It requires an AWS token from your server
2. Once provided, it displays an upload form
3. Once a picture is added, it resizes it and can display it as a thumbnail
4. It uploads it onto AWS S3

## Installing ng-image-upload

#### Packaging

`ng-image-upload` can be installed via npm (`npm install ng-image-upload --save`) or bower (`bower install ng-image-upload --save`).

After that, include one of the two distributions in your `index.html` and add `'ng-image-upload'` to your angular module's dependencies.

#### Dependencies

imgUpload has 2 dependencies which need to be loaded before using it:
- [angular.js] (https://github.com/angular/angular.js)
- [angular-file-upload] (https://github.com/nervgh/angular-file-upload)

Note that `lodash` and a few others are required as devDependencies in package.json but are simply build requirements. They are neither included nor required for `ng-image-upload` to function properly.

## Generating AWS S3 tokens

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

5. Provide the upload policy token

    This is what the client will pass to Amazon S3 in addition to the file to authenticate (through the signature) and authorize the upload. You must be especially careful : if the data in this token does not match your signed policy, the upload will be rejected with a `403 Forbidden` error.

    To avoid any mishaps, `ng-img-upload` expects a very precise formatting of the policy token, and **will throw** if your token does not abide by it.

    ```javascript
    {
        // These 5 fields are the required upload policy fields
        "acl": "<YOUR ACCESS-CONTROL-LIST>",
        "AWSAccessKeyId" : "<YOUR AWS PUBLIC KEY>",
        // should include the path to the file, eg /media/user/1234/profile_0.jpg
        "key": "<THE FILE'S KEY ON AMAZON S3>",
        "policy": "<YOUR BASE-64 ENCODED POLICY>",
        // HMAC-SHA-1 for any s3 region, HMAC-SHA-256 for Frankfurt
        "signature": "<YOUR BASE-64 ENCODED SIGNATURE>", 
        
        // This field is not part of the policy token per se, but ng-image-upload
        // will extract it and remove it before sending the policy.
        "url": "https://<YOUR BUCKET NAME>.s3.amazonaws.com/"
    }
    ```

    If you need more details on these fields, you can read [Amazon S3's own documentation](http://docs.aws.amazon.com/AmazonS3/latest/dev/HTTPPOSTForms.html).

## Using the imgUpload directive

imgUpload is used as a simple element directive: ` <img-upload></img-upload> `.

### Required parameters

imgUpload needs to get the policy token that will be sent to amazon alongside the file. There are two ways to hand your policy token to `ng-image-upload`. 

You can use any of these two parameters but if none of them is present, imgUpload will throw as soon as its controller is loaded.

#### tokenUrl - Provide a URL

`ng-image-upload` will make a POST request on this URL with the filename and expect the policy token in return. Here is an example:

```html
<img-upload token-url="https://www.example.com/api/tokenroute"></img-upload>
```

```
POST https://www.example.com/api/tokenroute { filename: 'my_file.jpg' }
```

`ng-image-upload` will expect the policy token as a response to this request. Note that this call uses angular.js's own `$http` so if you have setup a cookie or token interceptor for authentication, this should play nice with it.

#### getToken - Provide a fetcher function

If you need more advanced control over the token fetching, you can provide a function that will make the necessary calls. `ng-image-upload` will call it with the filename, a success callback that prepares the upload, and a failure callback that simply throws. Here is an example:

```javascript
// params: { filename: 'my_file.jpg' }
// success: the callback to trigger when the token has been fetched
// failure: a simple throwing callback
vm.fetchToken = function (params, success, failure) {
  // Fetch the token
  // ...

  success(token);
};
```

```html
<img-upload get-token="vm.fetchToken"></img-upload>
```

### Optional parameters

#### queueLimit (default 1)

Number of picture which can be uploaded

```html
    <img-upload queue-limit='10'></img-upload>
```

#### sizeLimit (default 10mo)

Limit to the size of the file to be uploaded in octets.

```html
    <img-upload size-limit='8000000'></img-upload>
```

#### method (default 'POST')

Http request method used for the upload. Note that AWS only accepts POST's

```html
    <img-upload method='PUT'></img-upload>
```

#### removeAfterUpload (default true)

if true, the picture is removed from the queue and the thumbnail disappears once the upload is complete

```html
    <img-upload remove-after-upload='false'></img-upload>
```

#### acceptAllTypes (default false)

if false, a filter is added to accept only jpg, png, jpeg, bmp and gif files

#### onUploadFinished (default noop)

A callback can be passed to the directive: onUploadFinished is called whenever the upload is done, no matter if it succeeded or not. An error is passed as argument (='null' if success).

```html
    <img-upload on-upload-finished="someFunction"></img-upload>
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
