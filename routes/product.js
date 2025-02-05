var express = require('express');
var productModel = require('../models/product.js');
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
var capitalize = require('capitalize');
var jwt = require('../services/jwt');
var permission = require('../services/permission');
var log = require('../services/apilogger.js');

var router = express.Router();

////////////////////////////////////////////////////////////////////////
//                     Create an product
////////////////////////////////////////////////////////////////////////
router.post('/', [ jwt.ensureJWTAuth, permission.hasType('Admin'),
  check('p_nombre_producto')
    .exists().withMessage('p_nombre_producto is required')
    .isLength({ min: 1, max: 255}).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('p_id_categoria')
    .exists().withMessage('p_id_categoria is required')
    .isInt().withMessage('p_id_categoria must be a number')
    .trim(),
  check('p_descripcion')
    .optional()
    .trim(),
  check('p_precio_unitario')
    .exists().withMessage('p_precio_unitario is required')
    .isLength({ min: 1}).withMessage('Must be between 1')
    .trim(),
  check('p_stock_actual')
    .exists().withMessage('p_stock_actual is required')
    .isInt().withMessage('p_stock_actual must be a number')
    .trim(),
  check('p_umbral_minimo')
    .exists().withMessage('p_umbral_minimo is required')
    .isInt().withMessage('p_umbral_minimo must be a number')
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
      if (data.p_nombre_producto) data.p_nombre_producto = capitalize.words(data.p_nombre_producto.toLowerCase());

      const [[[Product]]] = await productModel.create(data);

      if (!Product) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
      if (Product.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Product already created",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true,data: {product: Product.result}}, null, 3));
    } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
});

////////////////////////////////////////////////////////////////////////
//                Get list of all products
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

  const [[Products]] = await productModel.getAll(data.page, data.limit);
  if(!Products) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Products.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:0,products:[]}}, null, 3));
  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Products[0].total_count,products:Products}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

  module.exports = router;