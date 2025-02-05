var express = require('express');
var branch_officesModel = require('../models/branch_offices.js');
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
var jwt = require('../services/jwt');

var log = require('../services/apilogger');
var permission = require('../services/permission');

var config = require('../config');

var router = express.Router();

const ENVIRONMENT = config.ENVIRONMENT;


////////////////////////////////////////////////////////////////////////
//        Get list of all branch offices
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
      var fields = ["id_branch_office", "optical_shop_id", "name", "address", "city", "department", "prefix", "phone", "cellphone_prefix", "cellphone", "email", "bank_name", "account_number", "account_type_id", "lr_name", "lr_phone", "lr_email", "lr_identification_card", "lr_identification_card_document", "comission", "active", "created_at", "updated_at"];
        if (!fields.includes(value)) throw new Error('Not a valid field');
        else return true;
      })
    .trim(),
  check('filter')
    .optional()
    .custom(value => {
        try { value_a = JSON.parse(value); }
        catch(e) { throw new Error('Filter is not a valid json'); }
        var fields = ["id_branch_office", "optical_shop_id", "name", "address", "city", "department", "prefix", "phone", "cellphone_prefix", "cellphone", "email", "bank_name", "account_number", "account_type_id", "lr_name", "lr_phone", "lr_email", "lr_identification_card", "lr_identification_card_document", "comission", "active", "created_at", "updated_at"];
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
      if(filter.length === 0) filter = filter + 'branch_offices.' + element.field + ' ' + element.operator + ' "' + element.value+ '"';
      else filter = filter + ' AND ' + 'branch_offices.' + element.field + ' ' + element.operator + ' "' + element.value+ '"';
    });
  }
  
  //Assemble order_by
  if (data.order_by !== undefined) {
    var order_by = 'branch_offices.' + data.order_by
  }

  //Getting count of branch_offices 
  const [[[branchOfficesCount]]] = await branch_officesModel.countAll(filter);
  if(!branchOfficesCount) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(branchOfficesCount.result === -1) return res.status(500).send(JSON.stringify({success:false,error:{code:301, message:"Error in database",details:null}}, null, 3));
  
  if(branchOfficesCount.length == 0) return res.status(400).send(JSON.stringify({success:false,error:{code:301,message:"Is empty", details:null}}, null, 3));
  //Getting branch_offices
  const [[BranchOffices]] = await branch_officesModel.getAll(data.limit, data.offset, order_by, data.order, filter);
  if(!BranchOffices) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(BranchOffices.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:branchOfficesCount.count,BranchOffices:BranchOffices}}, null, 3));
  if(BranchOffices[0].result === -1) return res.status(500).send(JSON.stringify({success:false,error:{code:301, message:"Error in database",details:null}}, null, 3));
  
  return res.status(200).send(JSON.stringify({success:true,data:{count:branchOfficesCount.count,BranchOffices:BranchOffices}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
module.exports = router;