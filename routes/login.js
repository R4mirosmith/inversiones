var express = require('express');
var loginModel = require('../models/login');
var {
  check,
  validationResult
} = require('express-validator');
var {
  matchedData,
  sanitize
} = require('express-validator');

var basicAuth = require('../services/basicAuth');
var jwt = require('../services/jwt');
var log = require('../services/apilogger');
var permission = require('../services/permission');

var router = express.Router();

////////////////////////////////////////////////////////////////////////
//                      LOGIN
////////////////////////////////////////////////////////////////////////
router.post('/',basicAuth.ensureBasicAuth, [
    //Validations
    check('email')
    .optional()
    .isLength({
      min: 1,
      max: 100
    }).withMessage('Must be between 1 and 100 characters')
    .isEmail().withMessage('Should be a valid usuario')
    .trim(),
    check('password')
    .exists().withMessage('password is required')
    .isLength({
      min: 1,
      max: 255
    }).withMessage('Must be between 1 and 255 characters long')
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":login}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201,message: "Request has invalid data", details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);

      //Verify if data has email or mobile

        //Get user information
        const [[[User]]] = await loginModel.loginUser(data.email,data.password);
        if (!User) return res.status(500).send(JSON.stringify({ success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
        if (User.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Usuario o contraseña incorrecta",details: null}}, null, 3));
        if (User.result === -2) return res.status(404).send(JSON.stringify({success: false, error: {code: 402,message: "Usuario o contraseña incorrecta",details: null}}, null, 3));
        //Compare access
        if (check) {
          return res.status(200).send(JSON.stringify(jwt.createToken(User), null, 3));
        } else {
          return res.status(401).send(JSON.stringify({success: false,error: {code: 106, message: "Usuario o contraseña incorrecta"}}, null, 3));
         }
      
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.username}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in service or database", details: err } }, null, 3));
    }});


////////////////////////////////////////////////////////////////////////
//                      REAUTHENTICATE
////////////////////////////////////////////////////////////////////////
router.get('/reauthenticate', jwt.ensureJWTAuth, (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
    //Create new Token
    return res.status(200).send(JSON.stringify(jwt.reAuthentificateToken(req.user), null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}
    }, null, 3));
  }
});

module.exports = router;