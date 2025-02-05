var express = require('express');
var optometristsModel = require('../models/optometrists.js');
var optical_shopsModel = require('../models/admin.js');
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
var jwt = require('../services/jwt');

var log = require('../services/apilogger');
var permission = require('../services/permission');

var config = require('../config');

const { Console } = require('winston/lib/winston/transports');

var router = express.Router();

const ENVIRONMENT = config.ENVIRONMENT;





////////////////////////////////////////////////////////////////////////
//            Get list of all optometrists
////////////////////////////////////////////////////////////////////////
router.get('/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('limit')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('offset')
    .optional()
    .isInt({min:0}).withMessage('Should be an integer'),
  check('order')
    .optional()
    .isInt({min:0, max:1}).withMessage('Should be an integer between 0 and 1'),
  check('order_by')
    .optional()
    .isLength({min:1, max: 255}).withMessage('Must be between 1 and 255 characters')
    .custom(value => {
        var fields = ["id_optometrist", "user_id", "optical_shop_id", "identification_card", "identification_card_document", "professional_card", "professional_card_document", "active", "created_at", "updated_at"];
        if (!fields.includes(value)) throw new Error('Not a valid field');
        else return true;
      })
    .trim(),
  check('filter')
    .optional()
    .custom(value => {
        try { value_a = JSON.parse(value); }
        catch(e) { throw new Error('Filter is not a valid json'); }
        var fields = ["id_optometrist", "user_id", "optical_shop_id", "identification_card", "identification_card_document", "professional_card", "professional_card_document", "active", "created_at", "updated_at"];
        var operators = ["=", "!=", ">", "<", ">=", "<=", "LIKE"];
        if (!(value_a instanceof Array)) throw new Error('Filter should be an array');
        value_a.forEach(element => {
          if (element.field === undefined || element.operator === undefined || element.value === undefined) throw new Error(`Not a valid filter: ${JSON.stringify(element)}`);
          if (!fields.includes(element.field)) throw new Error(`Not a valid field: ${JSON.stringify(element)}`);
          if (!operators.includes(element.operator)) throw new Error(`Not a valid operator: ${JSON.stringify(element)}`);
        })
        return true;
      })
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 

  //Assemble filter
  if (data.filter !==undefined) {
    var filter = ``;
    var filter_a = JSON.parse(data.filter);
    filter_a.forEach(function(element){
      if(filter.length === 0) filter = filter + 'optometrists.' + element.field + ' ' + element.operator + ' "' + element.value+ '"';
      else filter = filter + ' AND ' + 'optometrists.' + element.field + ' ' + element.operator + ' "' + element.value+ '"';
    });
  }
  
  //Assemble order_by
  if (data.order_by !== undefined) {
    var order_by = 'optometrists.' + data.order_by
  }

  //Getting count of Optometrists 
  const [[[OptometristsCount]]] = await optometristsModel.countAll(filter);
  if(!OptometristsCount) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(OptometristsCount.result === -1) return res.status(500).send(JSON.stringify({success:false,error:{code:301, message:"Error in database",details:null}}, null, 3));
  
  if(OptometristsCount.length == 0) return res.status(400).send(JSON.stringify({success:false,error:{code:301,message:"Is empty", details:null}}, null, 3));
  //Getting Optometrists
  const [[Optometrists]] = await optometristsModel.getAll(data.limit, data.offset, order_by, data.order, filter);
  if(!Optometrists) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Optometrists.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:OptometristsCount.count,Optometrists:Optometrists}}, null, 3));
  if(Optometrists[0].result === -1) return res.status(500).send(JSON.stringify({success:false,error:{code:301, message:"Error in database",details:null}}, null, 3));
  
  return res.status(200).send(JSON.stringify({success:true,data:{count:OptometristsCount.count,Optometrists:Optometrists}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
module.exports = router;


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

      //get by optometrist id
      const [[[Optometrist]]] = await optometristsModel.getByUser(req.user.user_id);
      if (!Optometrist) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (Optometrist.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (Optometrist.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 402,message: "User not found",details: null}}, null, 3));
      if (Optometrist.result === -3) return res.status(404).send(JSON.stringify({success: false,error: {code: 402,message: "User is not Optometrist",details: null}}, null, 3));
      if (Optometrist.result === -4) return res.status(404).send(JSON.stringify({success: false,error: {code: 402,message: "Optometrist not found",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true, data: {user_found: Optometrist}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }});

////////////////////////////////////////////////////////////////////////
//               Get an optometrist data
////////////////////////////////////////////////////////////////////////
router.get('/:optometristid', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('optometristid')
  .exists().withMessage('optometrist is required')
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
    const [[[Optometrist]]] = await optometristsModel.getById(data.optometristid);
    if (!Optometrist) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
    if (Optometrist.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
    if (Optometrist.result === -2) return res.status(404).send(JSON.stringify({success: false, error: {code: 402, message: "User not found", details: null}}, null, 3));

    return res.status(200).send(JSON.stringify({success: true,data: {optometrist_found: Optometrist}}, null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
  }});
  
///////////////////////////////////////////////////////////////////////
//     Get an optometrist data of my Optical Shop
////////////////////////////////////////////////////////////////////////
router.get('/opticalshop/:optometristid', jwt.ensureJWTAuth, permission.hasType('OpticalShop'),[
  check('optometristid')
  .exists().withMessage('optometrist is required')
  .isInt({min: 1}).withMessage('Should be an integer greater than 0')
],
  async function (req, res, next) {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201,message: "Request has invalid data",details: errors.mapped()}}, null, 3));

      // Get matched data
      const data = matchedData(req);

      //We user by id 
      const [[[OpticalShop]]] = await optical_shopsModel.getByUser(req.user.user_id);
      if (!OpticalShop) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OpticalShop.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OpticalShop.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "User is not found",details: null}}, null, 3));
      if (OpticalShop.result === -3) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "User is not Optical Shop",details: null}}, null, 3));
      if (OpticalShop.result === -4) return res.status(404).send(JSON.stringify({success: false, error: {code: 402,message: " Optical Shop not found",details: null}}, null, 3));
        
      const [[[check]]] = await optometristsModel.checkBelonging(OpticalShop.id_optical_shop,data.optometristid);  
      if (OpticalShop.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OpticalShop.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "Optical shop not found",details: null}}, null, 3));
      if (OpticalShop.result === -3) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "Optometrist not found",details: null}}, null, 3));
      if (OpticalShop.result === -4) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "Optometrist does not belong to optical shop",details: null}}, null, 3));

      const [[[Optometrist]]] = await optometristsModel.getById(data.optometristid);
      if (OpticalShop.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OpticalShop.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "Optical shop not found",details: null}}, null, 3));
    
      return res.status(200).send(JSON.stringify({success: true,data: {user_found: Optometrist}}, null, 3));

    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
  });

  
////////////////////////////////////////////////////////////////////////
//           Check if user is available
////////////////////////////////////////////////////////////////////////
router.post('/check/user', jwt.ensureJWTAuth, [
  check('userid')
  .exists().withMessage('userid is required')
  .isInt({min: 1}).withMessage('Should be an integer greater than 0')
],
async function (req, res, next) {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

    //Handle validation errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201, message: "Request has invalid data", details: errors.mapped()}}, null, 3));

    //Get matched data
    const data = matchedData(req);

    const [[[Optometrist]]] = await optometristsModel.checkUser(data.userid);
    if (!Optometrist) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database", details: null}}, null, 3));
    if (Optometrist.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
    if (Optometrist.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 402, message: "Not available",details: null}}, null, 3));

    return res.status(200).send(JSON.stringify({success: true,data: {Optometrist_found: Optometrist}}, null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
  }});

////////////////////////////////////////////////////////////////////////
//             Create my optometrist
////////////////////////////////////////////////////////////////////////
router.post('/me', jwt.ensureJWTAuth, [
check('optical_shop_id')
  .optional()
  .exists().withMessage('optical shop id is required')
  .isInt({min: 1}).withMessage('Should be an integer greater than 0')
  .trim(),
check('identification_card')
  .optional()
  .isLength({min: 0 ,max: 255}).withMessage('Must be between 1 and 255 characters long')
  .trim(),
check('identification_card_document')
  .optional()
  .isLength({min: 0 ,max: 1024}).withMessage('Must be between 1 and 1024 characters long')
  .trim(),
check('professional_card')
  .optional()
  .isLength({min: 0 ,max: 255}).withMessage('Must be between 1 and 255 characters long')
  .trim(),
check('professional_card_document')
  .optional()
  .isLength({min: 0,max: 1024}).withMessage('Must be between 1 and 1024 characters long')
  .trim(),
],
async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

    //Handle validation errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201,message: "Request has invalid data",details: errors.mapped()}}, null, 3));

    //Get matched data
    const data = matchedData(req);

    //Prepare data
    if (data.first_name) data.first_name = capitalize.words(data.first_name.toLowerCase());
    if (data.last_name) data.last_name = capitalize.words(data.last_name.toLowerCase());

    //Create optometrist
    const [[[OptometristId]]] = await optometristsModel.post(req.user.user_id, data.optical_shop_id, data.identification_card, data.identification_card_document, 
      data.professional_card, data.professional_card_document);
    if (!OptometristId) return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in database",details: null}}, null, 3));
    if (OptometristId.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
    if (OptometristId.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 406,message: "User not found",details: null}}, null, 3));
    if (OptometristId.result === -3) return res.status(404).send(JSON.stringify({success: false, error: {code: 401,message: "User is ot Optometrist",details: null}}, null, 3));
    if (OptometristId.result === -4) return res.status(404).send(JSON.stringify({success: false, error: {code: 401,message: "User already has an Optometrist.",details: null}}, null, 3));

    return res.status(200).send(JSON.stringify({success: true,data: {optometrist_id: OptometristId.result}}, null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
  }
});

////////////////////////////////////////////////////////////////////////
//             Create an optometrist
////////////////////////////////////////////////////////////////////////
router.post('/', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('user_id')
  .exists().withMessage('user id is required')
  .isInt({min: 1}).withMessage('Should be an integer greater than 0'),
  check('optical_shop_id')
    .optional()
    .exists().withMessage('optical shop id is required')
    .trim(),
  check('identification_card')
    .optional()
    .isLength({min: 0 ,max: 255}).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('identification_card_document')
    .optional()
    .isLength({min: 0 ,max: 1024}).withMessage('Must be between 1 and 1024 characters long')
    .trim(),
  check('professional_card')
    .optional()
    .isLength({min: 0 ,max: 255}).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('professional_card_document')
    .optional()
    .isLength({min: 0,max: 1024}).withMessage('Must be between 1 and 1024 characters long')
    .trim(),
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201,message: "Request has invalid data",details: errors.mapped()}}, null, 3));
  
      //Get matched data
      const data = matchedData(req);
  
      //Prepare data
      if (data.first_name) data.first_name = capitalize.words(data.first_name.toLowerCase());
      if (data.last_name) data.last_name = capitalize.words(data.last_name.toLowerCase());
  
      //Create optometrist
      const [[[OptometristId]]] = await optometristsModel.post(data.user_id, data.optical_shop_id, data.identification_card, data.identification_card_document, 
        data.professional_card, data.professional_card_document);
      if (!OptometristId) return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OptometristId.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OptometristId.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 406,message: "User not found",details: null}}, null, 3));
      if (OptometristId.result === -3) return res.status(404).send(JSON.stringify({success: false, error: {code: 401,message: "User is ot Optometrist",details: null}}, null, 3));
      if (OptometristId.result === -4) return res.status(404).send(JSON.stringify({success: false, error: {code: 401,message: "User already has an Optometrist.",details: null}}, null, 3));
  
      return res.status(200).send(JSON.stringify({success: true,data: {optometrist_id: OptometristId.result}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
  });
  
////////////////////////////////////////////////////////////////////////
//          Create an optometrist of my Optical Shop
////////////////////////////////////////////////////////////////////////
router.post('/opticalshop', jwt.ensureJWTAuth, permission.hasType('OpticalShop'), [
  check('user_id')
  .exists().withMessage('user id is required')
  .isInt({min: 1}).withMessage('Should be an integer greater than 0'),
  check('identification_card')
    .optional()
    .isLength({min: 0 ,max: 255}).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('identification_card_document')
    .optional()
    .isLength({min: 0 ,max: 1024}).withMessage('Must be between 1 and 1024 characters long')
    .trim(),
  check('professional_card')
    .optional()
    .isLength({min: 0 ,max: 255}).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('professional_card_document')
    .optional()
    .isLength({min: 0,max: 1024}).withMessage('Must be between 1 and 1024 characters long')
    .trim(),
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201,message: "Request has invalid data",details: errors.mapped()}}, null, 3));
  
      //Get matched data
      const data = matchedData(req);
  
      //Get optical shop data by id
      const [[[OpticalShop]]] = await optical_shopsModel.getByUser(req.user.user_id);
      if(!OpticalShop) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
      if(OpticalShop.result === -1) return res.status(500).send(JSON.stringify({success:false,error:{code:301, message:"Error in database",details:null}}, null, 3));
      if(OpticalShop.result === -2) return res.status(404).send(JSON.stringify({success:false,error:{code:409,message:"User not found", details:null}}, null, 3));
      if(OpticalShop.result === -3) return res.status(404).send(JSON.stringify({success:false,error:{code:409,message:"User is not Optical Shop", details:null}}, null, 3));
      if(OpticalShop.result === -4) return res.status(404).send(JSON.stringify({success:false,error:{code:409,message:"Optical Shop not found", details:null}}, null, 3));

      //Prepare data
      if (data.first_name) data.first_name = capitalize.words(data.first_name.toLowerCase());
      if (data.last_name) data.last_name = capitalize.words(data.last_name.toLowerCase());

      //Create optometrist
      const [[[OptometristId]]] = await optometristsModel.post(OpticalShop.user_id,OpticalShop.id_optical_shop, data.identification_card, data.identification_card_document, 
        data.professional_card, data.professional_card_document);
      if (!OptometristId) return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OptometristId.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
      if (OptometristId.result === -2) return res.status(404).send(JSON.stringify({success: false,error: {code: 406,message: "User not found",details: null}}, null, 3));
      if (OptometristId.result === -3) return res.status(404).send(JSON.stringify({success: false, error: {code: 401,message: "User is Optometrist",details: null}}, null, 3));
      if (OptometristId.result === -4) return res.status(404).send(JSON.stringify({success: false, error: {code: 401,message: "User already has an Optometrist.",details: null}}, null, 3));
  
      return res.status(200).send(JSON.stringify({success: true,data: {optometrist_id: OptometristId.result}}, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false, error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
  });
  