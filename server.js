var express    = require('express')
var morgan     = require('morgan')
var app        = express()
var bodyParser = require('body-parser')
var multer     = require('multer')

app.use(multer({ dest: './uploads/',
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
}}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan(':remote-addr :method :url :status :res[content-length] :response-time ms'))
app.use(express.static(__dirname));


app.get('/', function (req, res) {
  res.render('./index.html')
})

app.get('/token', function (req, res) {
  res.send('8f40f9c6afe7003aa3a2fdbbea54e062084056ba073ebab2ec67392c8b3f99bf')
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
