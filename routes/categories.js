
var express = require('express');
var categoriesModel = require('../models/categories.js');

var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
var capitalize = require('capitalize');
var log = require('../services/apilogger.js');
var permission = require('../services/permission.js');
var jwt = require('../services/jwt.js');
var router = express.Router();

////////////////////////////////////////////////////////////////////////
//                Get list of all categories
////////////////////////////////////////////////////////////////////////
router.get('/all', jwt.ensureJWTAuth, permission.hasType('Admin'), 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Categories
  const [[Categories]] = await categoriesModel.getAll(data.page, data.limit);
  if(!Categories) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Categories.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Categories.length,categories:[]}}, null, 3));
  return res.status(200).send(JSON.stringify({success:true,data:{count:Categories.length,categories:Categories}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
module.exports = router;