var express    = require('express')
var morgan     = require('morgan')
var app        = express()
var bodyParser = require('body-parser')
var multer     = require('multer')
var secret     = require('./secret');

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

app.get('/token', function (req, res) {
  var token = secret.token;
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
    //url: 'https://<YOUR BUCKET NAME>.s3.amazonaws.com/'
  //}

  res.send(token);
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
