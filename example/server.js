var express    = require('express')
var morgan     = require('morgan')
var app        = express()
var bodyParser = require('body-parser')
var multer     = require('multer')
var secret     = require('./secret');
var md5        = require('MD5');

app.use(multer({ dest: './uploads/',
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
}}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan(':remote-addr :method :url :status :res[content-length] :response-time ms'))
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/..'));


app.get('/', function (req, res) {
  res.render('./index.html')
})

app.post('/token', function (req, res) {
  var token = secret.token;
  // Hash the filename
  token.filename = md5(req.body.filename)

  // The token has the following format (dummy data, do not use for production :) ):
  //var token = {
    //AWSKey : 'AKRllRIlRllRKKNSDFAS',
    //policy:
      //'efdsfKKKfdsffdsLLfdsff92fds23fsljfsdfsdfsdflfds00DBaIiwKICAiY29uZGl0aW9uc' +
      //'yI6IFsKICAgIHsiYnVjasaq22ogImFuZ3VsYfdsfdsvYWQifSdsfdsfIFsic3RhcnRzLXdpdG' +
      //'giLCAiJGtleSIsICIiXSwKICAfdLsiYWNsIjogInByaXZhdGUifSwKICAgIFsic3RhcnRzLXd' +
      //'pdGgiLCAiJENvbnRlbnQtVHlwZSIfdaAiXSwKICAgIFsic3RhcnRzLXdpdGgiLCAiJGZpbGVu' +
      //'YW1lf1wgIiJdLAogICAgWyJjb250ZW504Wxlbmd0aC1yYW5nZSIsIDAsIDUyNDI4ODAwMF0KI' +
      //'CBdCfds',
    //signature: 'SFDFDsaa0923rfdfdsfsdfuBq0c=',
    //uploadUrl: 'https://<YOUR BUCKET NAME>.s3.amazonaws.com/',
    //responseUrl: '/response'
  //}

  res.send(token);
})

app.post('/response', function (req, res) {
  console.log(req.body.response);
  res.sendStatus(200)
})

app.post('/upload', function (req, res) {
  console.log(req.query);
  console.log(req.files);
  res.sendStatus(200)
})

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('listening at http://%s:%s', host, port)
})
