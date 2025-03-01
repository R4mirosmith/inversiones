var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
var helmet = require('helmet');
var cors = require('cors');
var basicAuth = require('../services/basicAuth');
var config = require('../config');
var jwt = require('../services/jwt');
const path = require('path');
//Create app
var app = express();

//Enable ALL CORS Requests
app.use(cors());

//App modules
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json({type: ['json', 'text']}));

//Compress application responses
app.use(compression());

//Configure security headers
app.use(helmet());

//Handle body parser errors
app.use((err, req, res, next) => {
  if (err) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).send(JSON.stringify({success: false,error: {code: 201, message: "Request has invalid data",details: err}}, null, 3));
  } else {
    next();
  }
})

//Load routes
// app.use('/api/user', require('../routes/users.js'));
// app.use('/api/login', require('../routes/login.js'));
app.use('/apinversion/inversiones', require('../routes/lottery.js'));
// app.use('/api/categories', require('../routes/categories.js'));
// app.use('/api/optometrist', require('../routes/optometrists.js'));
// app.use('/api/operator', require('../routes/operator.js'));
// app.use('/api/branchoffice', require('../routes/branch_offices.js'));
// Ruta para servir archivos estáticos de la carpeta 'uploads'
// app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

//Base routes
app.get('/apinversion/welcome', (req, res) => {
  res.status(200).send({
    message: 'Welcome to yumly Extension API'
  });
});


//Export app
module.exports = app;