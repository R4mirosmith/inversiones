var express = require('express');
var adminModel = require('../models/admin.js');
var userModel = require('../models/users');
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
const { v4: uuidv4 } = require('uuid');
var jwt = require('../services/jwt.js');
var capitalize = require('capitalize');
var momentz = require('moment-timezone');

var log = require('../services/apilogger.js');
var permission = require('../services/permission.js');

var config = require('../config.js');

var router = express.Router();

const ENVIRONMENT = config.ENVIRONMENT;


////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/jornadas/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('limit')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('page')
    .optional()
    .isInt({min:0}).withMessage('Should be an integer'),
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Jornadas]] = await adminModel.getAll(data.page, data.limit);
  if(!Jornadas) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Jornadas.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas.count,jornadas:Jornadas}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas[0].total,jornadas:Jornadas}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/gastos/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('fecha_ini')
    .optional()
    .trim()
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Gastos]] = await adminModel.getGastosOperacionalesAll(data.fecha_ini);
  if(!Gastos) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Gastos.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Gastos.count,gastos:Gastos}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Gastos[0].total,gastos:Gastos}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                Get list of ingresos
////////////////////////////////////////////////////////////////////////
router.get('/ingresos/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('fecha_ini')
    .exists().withMessage('fecha inicial es requerida')
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Jornadas]] = await adminModel.getAllIngresosByFechas(data.fecha_ini, data.fecha_ini);
  if(!Jornadas) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Jornadas.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas.count,jornadas:Jornadas}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas[0].total,jornadas:Jornadas}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/viajes/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('limit')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('page')
    .optional()
    .isInt({min:0}).withMessage('Should be an integer')
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 

  
  //Getting Jornadas
  const [[Viajes]] = await adminModel.getAllVehiculos(data.page, data.limit);
  if(!Viajes) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Viajes.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes.length,viajes:Viajes}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes.length,viajes:Viajes}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/tipovehiculo/all', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('limit')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('page')
    .optional()
    .isInt({min:0}).withMessage('Should be an integer'),
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[TipoVehiculo]] = await adminModel.getTipoAdminVehiculo(data.page, data.limit);
  if(!TipoVehiculo) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(TipoVehiculo.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:TipoVehiculo.count,tipovehiculo:TipoVehiculo}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:TipoVehiculo[0].total,tipovehiculo:TipoVehiculo}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
////////////////////////////////////////////////////////////////////////
//                Get list of all ferrys
////////////////////////////////////////////////////////////////////////
router.get('/ferrys/all', jwt.ensureJWTAuth, permission.hasType('Admin'), 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Ferrys]] = await adminModel.getFerryAll();
  if(!Ferrys) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Ferrys.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Ferrys.length,ferrys:Ferrys}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Ferrys.length,ferrys:Ferrys}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
////////////////////////////////////////////////////////////////////////
//                Get list of all trayectos
////////////////////////////////////////////////////////////////////////
router.get('/trayectos/all', jwt.ensureJWTAuth, 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Trayectos]] = await adminModel.getTrayectos();
  if(!Trayectos) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Trayectos.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Trayectos.length,trayectos:Trayectos}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Trayectos.length,trayectos:Trayectos}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                     Create an jornada
////////////////////////////////////////////////////////////////////////
router.post('/', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('id_ferry')
    .exists().withMessage('id_ferry is required')
    .isInt({min: 1,})
    .trim(),
  check('fecha_inicio')
    .exists().withMessage('fecha_inicio is required')
    .isLength({min: 1,max: 50}).withMessage('Must be between 1 and 50 characters long')
    .trim(),
  check('fecha_fin')
    .exists().withMessage('fecha_fin is required')
    .isLength({ min: 1, max: 50}).withMessage('Must be between 1 and 50 characters long')
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
        // if (data.trayecto) data.trayecto = capitalize.words(data.trayecto.toLowerCase());
  
  
        const [[[JornadaId]]] = await adminModel.post(data.id_ferry,data.fecha_inicio,data.fecha_fin,req.user.user_id);
  
        if (!JornadaId) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
        if (JornadaId.result != 1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
        
        return res.status(200).send(JSON.stringify({success: true,data: {jornada_id: JornadaId.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
    });
////////////////////////////////////////////////////////////////////////
//                     Create an tipo vehiculo
////////////////////////////////////////////////////////////////////////
router.post('/tipovehiculo', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('tarifa')
    .exists().withMessage('p_tarifa is required')
    .trim(),
  check('tipo_vehiculo')
    .exists().withMessage('tipo_vehiculo is required')
    .isLength({min: 1,max: 255}).withMessage('Must be between 1 and 512 characters long')
    .trim()
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
        if (data.tipo_vehiculo) data.tipo_vehiculo = capitalize.words(data.tipo_vehiculo.toLowerCase());
  
  
        const [[[TipoVehiculo]]] = await adminModel.postTipoVehiculo(data.tipo_vehiculo,data.tarifa,req.user.user_id);
  
        if (!TipoVehiculo) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
        if (TipoVehiculo.result < 1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
        
        return res.status(200).send(JSON.stringify({success: true,data: {tipovehiculo: TipoVehiculo.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
    });

    ////////////////////////////////////////////////////////////////////////
//                     Crear un gasto operacional
////////////////////////////////////////////////////////////////////////
router.post('/gastooperacional', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('fecha_inicial')
    .exists().withMessage('fecha_inicial is required')
    .trim(),
  check('descripcion_gasto_operacional')
    .exists().withMessage('descripcion_gasto_operacional is required')
    .isLength({ min: 1, max: 255 }).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('total_gasto_operacional')
    .exists().withMessage('total_gasto_operacional is required')
    .isDecimal({min: 0})
    .trim(),
],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

      // Manejo de errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({ success: false, error: { code: 201, message: "Request has invalid data", details: errors.mapped() } }, null, 3));

      // Obtener los datos del cuerpo de la solicitud
      const data = matchedData(req);

      // Preparar los parámetros para el SP (puedes capitalizar la descripción si lo deseas)
      data.descripcion_gasto_operacional = capitalize.words(data.descripcion_gasto_operacional.toLowerCase());

      // Llamar al modelo para ejecutar el stored procedure
      const [[[gastoOperacional]]] = await adminModel.insertarGastoOperacional(
        data.monto_total_periodo,
        data.fecha_inicial,
        data.fecha_inicial,
        data.descripcion_gasto_operacional,
        data.total_gasto_operacional,
        req.user.user_id
      );

      // Verificar el resultado del stored procedure
      if (!gastoOperacional) return res.status(500).send(JSON.stringify({ success: false, error: { code: 301, message: "Error en la base de datos", details: null } }, null, 3));
      if (gastoOperacional.result < 1) return res.status(500).send(JSON.stringify({ success: false, error: { code: 301, message: "Error en la base de datos", details: null } }, null, 3));

      // Respuesta exitosa
      return res.status(200).send(JSON.stringify({ success: true, data: { gastoOperacional: gastoOperacional.result } }, null, 3));
    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({ success: false, error: { code: 301, message: "Error en el servicio o la base de datos", details: err } }, null, 3));
    }
  });


////////////////////////////////////////////////////////////////////////
//                     Update an tipo vehiculo
////////////////////////////////////////////////////////////////////////
router.post('/tipovehiculo/tarifa', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('id_tipo_vehiculo')
    .exists().withMessage('id_tipo_vehiculo is required')
    .isInt()
    .trim(),
  check('tarifa')
    .exists().withMessage('p_tarifa is required')
    .isInt()
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
        // if (data.tipo_vehiculo) data.tipo_vehiculo = capitalize.words(data.tipo_vehiculo.toLowerCase());
  
  
        const [[[TipoVehiculo]]] = await adminModel.putTipoVehiculo(data.id_tipo_vehiculo,data.tarifa,req.user.user_id);
  
        if (!TipoVehiculo) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
        if (TipoVehiculo.result < 1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
        
        return res.status(200).send(JSON.stringify({success: true,data: {tipovehiculo: TipoVehiculo.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
    });
////////////////////////////////////////////////////////////////////////
//                    DELETE TRAYECTOS
////////////////////////////////////////////////////////////////////////
router.post('/trayecto/delete', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('id_viaje')
    .exists().withMessage('id_viaje is required')
    .isInt()
    .trim(),
  check('is_delete')
    .exists().withMessage('is_delete is required')
    .isInt()
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
        // if (data.tipo_vehiculo) data.tipo_vehiculo = capitalize.words(data.tipo_vehiculo.toLowerCase());
  
  
        const [[[Trayecto]]] = await adminModel.putDeleteTrayectos(data.id_viaje,data.is_delete);
  
        if (!Trayecto) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
        if (Trayecto.result < 1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
        
        return res.status(200).send(JSON.stringify({success: true,data: {trayecto: Trayecto.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
    });
////////////////////////////////////////////////////////////////////////
//                     Update an status user
////////////////////////////////////////////////////////////////////////
router.post('/usuario/status', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('id_usuario')
    .exists().withMessage('id_usuario is required')
    .isInt({min: 1,})
    .trim(),
  check('estado')
    .exists().withMessage('estado is required')
    .isInt()
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
        // if (data.tipo_vehiculo) data.tipo_vehiculo = capitalize.words(data.tipo_vehiculo.toLowerCase());
  
  
        const [[[TipoVehiculo]]] = await adminModel.putStatusUser(data.id_usuario,data.estado);
  
        if (!TipoVehiculo) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
        if (TipoVehiculo.result < 1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
        
        return res.status(200).send(JSON.stringify({success: true,data: {usuario: TipoVehiculo.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
    });
////////////////////////////////////////////////////////////////////////
//                     Update an status jorandas
////////////////////////////////////////////////////////////////////////
router.post('/jornadas/status', jwt.ensureJWTAuth, permission.hasType('Admin'), [
  check('id_jornada')
    .exists().withMessage('id_jornada is required')
    .isInt({min: 1,})
    .trim(),
  check('estado')
    .exists().withMessage('estado is required')
    .isInt()
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
        // if (data.tipo_vehiculo) data.tipo_vehiculo = capitalize.words(data.tipo_vehiculo.toLowerCase());
  
  
        const [[[Jornada]]] = await adminModel.putStatusjornada(data.id_jornada,data.estado);
  
        if (!Jornada) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
        if (Jornada.result < 1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));
        
        return res.status(200).send(JSON.stringify({success: true,data: {jornada: Jornada.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
    });

    ////////////////////////////////////////////////////////////////////////
//               Get an invoice detail data
////////////////////////////////////////////////////////////////////////
router.get('/vehiculo/:vehiculoid', jwt.ensureJWTAuth, [
  check('vehiculoid')
  .exists().withMessage('vehiculoid is required')
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
    const [[[Vehiculo]]] = await adminModel.getVehiculoById(data.vehiculoid);
    if (!Vehiculo) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
    if (Vehiculo.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));

    return res.status(200).send(JSON.stringify({success: true,data: {vehiculo: Vehiculo}}, null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
}});



  module.exports = router;