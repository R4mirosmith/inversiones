var express = require('express');
var userModel = require('../models/users');
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
var uuid = require('uuid');
var jwt = require('../services/jwt');
var capitalize = require('capitalize');
var momentz = require('moment-timezone');

var log = require('../services/apilogger');
var permission = require('../services/permission');

var config = require('../config');
var basicAuth = require('../services/basicAuth');

var router = express.Router();

const ENVIRONMENT = config.ENVIRONMENT;





////////////////////////////////////////////////////////////////////////
//              Get catalog of User Types
////////////////////////////////////////////////////////////////////////
router.get('/types', jwt.ensureJWTAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

    //Get user types
     const [[Types]] = await userModel.getTypes();
     if (!Types) return res.status(500).send(JSON.stringify({success: false, error: {code: 301,  message: "Error in database",details: null}}, null, 3));

     return res.status(200).send(JSON.stringify({success: true,data: {user_types: Types}}, null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//              Get catalog of User Account Types
////////////////////////////////////////////////////////////////////////
router.get('/accounttypes', jwt.ensureJWTAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

    //Get user account types
     const [[Types]] = await userModel.getAccountTypes();
     if (!Types) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));

     return res.status(200).send(JSON.stringify({success: true,data: {account_types: Types}}, null, 3));

   } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
  }});


////////////////////////////////////////////////////////////////////////
//                Get list of all users
////////////////////////////////////////////////////////////////////////
router.get('/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('page')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('limit')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0')
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 

  // Assemble filter
  if (data.filter !==undefined) {
    var filter = ``;
    var filter_a = JSON.parse(data.filter);
    filter_a.forEach(function(element){
      if(filter.length === 0) filter = filter + 'usuarios.' + element.field + ' ' + element.operator + ' "' + element.value+ '"';
      else filter = filter + ' AND ' + 'usuarios.' + element.field + ' ' + element.operator + ' "' + element.value+ '"';
    });
  }
  
  // Assemble order_by
  if (data.order_by !== undefined) {
    var order_by = 'usuarios.' + data.order_by
  }

  const [[Users]] = await userModel.getAll(data.page, data.limit, order_by, data.order, filter);
  if(!Users) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Users.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Users.count,Users:Users}}, null, 3));
  if(Users[0].result === -1) return res.status(500).send(JSON.stringify({success:false,error:{code:301, message:"Error in database",details:null}}, null, 3));
  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Users.count,Users:Users}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//               Get my user data
////////////////////////////////////////////////////////////////////////
router.get('/me', jwt.ensureJWTAuth,
  async function (req, res, next) {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false, error: {code: 201, message: "Request has invalid data",details: errors.mapped()}}, null, 3));
      // Get matched data
      // const data = matchedData(req);

      //get by user id
      const [[[User]]] = await userModel.getById(req.user.user_id);
      if (!User) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (User.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (User.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 402,message: "User not found",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true, data: {user_found: User}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }});

////////////////////////////////////////////////////////////////////////
//                Get an user data
////////////////////////////////////////////////////////////////////////
router.get('/:userid', jwt.ensureJWTAuth, permission.hasType('Admin'), [
    check('userid')
    .exists().withMessage('User id is required')
    .isInt({min: 1}).withMessage('Should be an integer greater than 0')
  ],
  async function (req, res, next) {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: { code: 201, message: "Request has invalid data",details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);

      //Get user information by id
      const [[[User]]] = await userModel.getById(data.userid);
      if (!User) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (User.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
      if (User.result === -2) return res.status(404).send(JSON.stringify({success: false, error: {code: 402, message: "User not found", details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true,data: {user_found: User}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }});

////////////////////////////////////////////////////////////////////////
//            Check if email is available
////////////////////////////////////////////////////////////////////////
router.post('/check/email', jwt.ensureJWTAuth, [
    check('email')
    .isEmail()
    .isLength({min: 1, max: 100}).withMessage('Must be between 1 and 100 characters')
    .trim(),
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      //Handle validations errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false, error: {code: 201,message: "Request has invalid data",details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);
      //Get users by email
      const [[Users]] = await userModel.getChekEmail(data.email);
      if (!Users) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "Error in database",details: null}}, null, 3));
      if (!Users[0]) return res.status(200).send(JSON.stringify({success: true,data: {count: 0,users: []}}, null, 3));
      if (Users[0].result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (Users[0].result === -2) return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true, data: {users: Users}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }});

////////////////////////////////////////////////////////////////////////
//                     Create an user
////////////////////////////////////////////////////////////////////////
router.post('/', [
check('email')
  .optional()
  .isLength({ min: 1, max: 255}).withMessage('Must be between 1 and 255 characters long')
  .isEmail().withMessage('Should be a valid email')
  .trim(),
check('password')
  .exists().withMessage('password is required')
  .isLength({min: 1,max: 512}).withMessage('Must be between 1 and 512 characters long')
  .trim(),
check('nombre')
  .exists().withMessage('nombre is required')
  .isLength({min: 1,max: 255}).withMessage('Must be between 1 and 255 characters long')
  .trim(),
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}"`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201, message: "Request has invalid data", details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);

      //Prepare data
      if (data.nombre) data.nombre = capitalize.words(data.nombre.toLowerCase());

      const [[[User]]] = await userModel.post(data.nombre,data.email,data.password);

      if (!User) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
      if (User.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
      if (User.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 406, message: "Email already used",details: null}}, null, 3));
      // if (User.result === -3) return res.status(404).send(JSON.stringify({success: false,error: {code: 401,message: "Account type not found",details: null }}, null, 3));
      // if (User.result === -4) return res.status(404).send(JSON.stringify({success: false,error: {code: 401,message: "Email already used",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true,data: {user_id: User.result}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
  });

////////////////////////////////////////////////////////////////////////
//                     update password user
////////////////////////////////////////////////////////////////////////
router.post('/change-password', jwt.ensureJWTAuth, permission.hasType('Admin'), [
check('id_usuario')
  .exists().withMessage('id_usuario is required')
  .trim(),
check('password')
  .exists().withMessage('password is required')
  .isLength({min: 1,max: 512}).withMessage('Must be between 1 and 512 characters long')
  .trim(),

  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201, message: "Request has invalid data", details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);

      //Prepare data

      const [[[UserId]]] = await userModel.updatePassword(data.id_usuario,data.password);

      if (!UserId) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
      if (UserId.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
      // if (UserId.result === -3) return res.status(404).send(JSON.stringify({success: false,error: {code: 401,message: "Account type not found",details: null }}, null, 3));
      // if (UserId.result === -4) return res.status(404).send(JSON.stringify({success: false,error: {code: 401,message: "Email already used",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true,data: {user_id: UserId.result}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
  });



////////////////////////////////////////////////////////////////////////
//                     Delete a user
////////////////////////////////////////////////////////////////////////
router.delete('/:userid', jwt.ensureJWTAuth, permission.hasType('Admin'), [
    check('userid')
    .exists().withMessage('User id is required')
    .isInt({min: 1}).withMessage('Should be an integer greater than 0')
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false, error: { code: 201, message: "Request has invalid data", details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);

      //Delete user data
      const [[[User]]] = await userModel.delete(data.userid);
      if (!User) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (User.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (User.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 403,message: "User not found",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true, data: {success: "1"}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({
        success: false,
        error: {
          code: 301,
          message: "Error in service or database",
          details: err
        }
      }, null, 3));
    }
  });



module.exports = router;