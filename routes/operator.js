var express = require('express');
var operatorModel = require('../models/operator.js');
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
var jwt = require('../services/jwt.js');
var capitalize = require('capitalize');
var log = require('../services/apilogger.js');
var permission = require('../services/permission.js');
const multer = require('multer');
const path = require('path');
var config = require('../config.js');

var router = express.Router();

const ENVIRONMENT = config.ENVIRONMENT;

// Configurar el almacenamiento de los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, '/Users/smith/documents/proyecto-trnasdier/api/server/uploads/'); // Asegúrate de tener un directorio "uploads"
    cb(null, '/develop/api-transdier/server/uploads/'); // Asegúrate de tener un directorio "uploads"
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Asigna un nombre único al archivo
  }
});

// Crea el middleware para procesar los archivos (tamaño límite de 10MB)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de tamaño de archivo (10MB)
});



////////////////////////////////////////////////////////////////////////
//         Get list of all jornadas
////////////////////////////////////////////////////////////////////////
router.get('/all', jwt.ensureJWTAuth, 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 

  //Getting jornadas
  const [[Jorandas]] = await operatorModel.getAll();
  if(!Jorandas) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Jorandas.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Jorandas.length,jornadas:Jorandas}}, null, 3));
  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Jorandas.length,jorandas:Jorandas}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
////////////////////////////////////////////////////////////////////////
//         Get list of all tipo vehiculos
////////////////////////////////////////////////////////////////////////
router.get('/vehicletype', jwt.ensureJWTAuth, 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  // const data = matchedData(req); 

  //Getting jornadas
  const [[TipoVehiculo]] = await operatorModel.getVehicleType();
  if(!TipoVehiculo) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  
  return res.status(200).send(JSON.stringify({success:true,data:{count:TipoVehiculo.length,tipovehiculo:TipoVehiculo}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                     Create an vehicle
////////////////////////////////////////////////////////////////////////
router.post('/', jwt.ensureJWTAuth, upload.single('image'), [
  check('journey_id')
    .exists().withMessage('journey_id is required')
    .isInt({min: 1,})
    .trim(),
  check('id_viaje')
    .exists().withMessage('id_viaje is required')
    .isInt({min: 1,})
    .trim(),
  check('driver_name')
    .optional()
    .trim(),
  check('driver_phone')
    .optional()
    .trim(),
  check('driver_id')
    .optional()
    .trim(),
  check('vehicle_type_id')
    .exists().withMessage('vehicle_type_id is required')
    .isInt({min: 1,})
    .trim(),
  check('vehicle_license')
    .exists().withMessage('vehicle_license is required')
    .isLength({min: 1,max:7}).withMessage('Must be between 1 and 7 characters long')
    .trim(),
  check('trailer_license')
    .optional()
    .trim(),
  check('fecha_crea')
    .exists().withMessage('fecha_crea is required')
    .isLength({min: 1,max:20}).withMessage('Must be between 1 and 20 characters long')
    .trim(),
  check('hora')
    .exists().withMessage('hora is required')
    .isLength({min: 1,max:20}).withMessage('Must be between 1 and 20 characters long')
    .trim(),
  check('trayecto')
    .exists().withMessage('trayecto is required')
    .isInt({min: 1,})
    .trim()
], async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

    //Handle validation errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false, error: {code: 201, message: "Request has invalid data", details: errors.mapped()}}, errors.mapped(), 3));

    //Get matched data
    const data = matchedData(req);

    // Prepare data (e.g., capitalize driver name)
    if (data.driver_name) data.driver_name = capitalize.words(data.driver_name.toLowerCase());

    // Encrypt Access
    data.user_id = req.user.user_id;

    // Check if image was uploaded, then add filename to data
    if (req.file && req.file.filename) {
      data.image = req.file.filename;  // Store the image filename
    } else {
      data.image = null;  // If no image is uploaded, set it as null
    }
   

    //Create user
    const [[[Factura]]] = await operatorModel.post(data);
    console.log(Factura,"**************Factura*************");
    if (!Factura) return res.status(500).send(JSON.stringify({success: false, error: { code: 301, message: "Error no se pudo completar la operación", details: null}}, null, 3));
    if (Factura.result == -1) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "La jornada ha finalizado. Por favor, comuníquese con el administrador para abrir una nueva",details: null}}, null, 3));
    if (Factura.result == -2) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "La jornada ha finalizado. Por favor, comuníquese con el administrador para abrir una nueva",details: null}}, null, 3));
    if (Factura.result == -3) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "Ya existe un vehiculo con esa placa con un tipo de vehiculo diferente",details: null}}, null, 3));
    if (Factura.result == -7) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "No se puede embarcar dos veces el mismo vehiculo en el mismo trayecto",details: null}}, null, 3));
    console.log(Factura,"**************Factura*************");
    return res.status(200).send(JSON.stringify({success: true, data: {response: Factura.result}}, null, 3));

  } catch (err) {
    console.log(err);
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "Error in service or database", details: err}}, null, 3));
  }
});

////////////////////////////////////////////////////////////////////////
//                     Create an vehicle
////////////////////////////////////////////////////////////////////////
router.post('/open-trayecto', jwt.ensureJWTAuth, [
  check('fecha_crea')
    .exists().withMessage('fecha_crea is required')
    .trim(),
  check('trayecto_id')
    .exists().withMessage('trayecto_id is required')
    .isInt({min: 1,})
    .trim()
], async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}"}`);

    //Handle validation errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false, error: {code: 201, message: "Request has invalid data", details: errors.mapped()}}, null, 3));

    //Get matched data
    const data = matchedData(req);
    // Encrypt Access
    data.user_id = req.user.user_id;

    // Check if image was uploaded, then add filename to data
    if (req.file && req.file.filename) {
      data.image = req.file.filename;  // Store the image filename
    } else {
      data.image = null;  // If no image is uploaded, set it as null
    }

    //Create user
    const [[[Trayecto]]] = await operatorModel.Opentrayecto(data,data.user_id);

    if (!Trayecto) return res.status(500).send(JSON.stringify({success: false, error: { code: 301, message: "Error no se pudo completar la operación", details: null}}, null, 3));
    if (Trayecto.result == -2) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "La jornada ha finalizado. Por favor, comuníquese con el administrador para abrir una nueva",details: null}}, null, 3));
    if (Trayecto.result == -3) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "El trayecto anterior no está cerrado, no se puede abrir uno nuevo",details: null}}, null, 3));
    if (Trayecto.result == -4) return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "Trayecto repetido",details: null}}, null, 3));

    return res.status(200).send(JSON.stringify({success: true, data: {response: Trayecto.result}}, null, 3));

  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false, error: {code: 301, message: "Error in service or database", details: err}}, null, 3));
  }
});


////////////////////////////////////////////////////////////////////////
//               Get an invoice detail data
////////////////////////////////////////////////////////////////////////
router.get('/:facturaid', jwt.ensureJWTAuth, [
  check('facturaid')
  .exists().withMessage('facturaid is required')
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
    const [[[Factura]]] = await operatorModel.getFacturaDetalleById(data.facturaid);
    if (!Factura) return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in database",details: null}}, null, 3));
    if (Factura.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "Error in database",details: null}}, null, 3));

    return res.status(200).send(JSON.stringify({success: true,data: {factura: Factura}}, null, 3));
  } catch (err) {
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
}});



////////////////////////////////////////////////////////////////////////
//                     update status factura
////////////////////////////////////////////////////////////////////////
router.post('/electronic', jwt.ensureJWTAuth, [
  check('id_factura')
    .exists().withMessage('id_factura is required')
    .isInt({min: 1,})
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
        if (data.driver_name) data.driver_name = capitalize.words(data.driver_name.toLowerCase());
       
        //Encrypt Access
        data.user_id = req.user.user_id;
        //Create user
        const [[[Response]]] = await operatorModel.put(data.id_factura);
  
        if (!Response) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error no se pudo completar la operación", details: null}}, null, 3));
        if (Response.result < 1 || Response.result == undefined || Response.result == null) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "*Error no se pudo completar la operación",details: null}}, null, 3));
      
        return res.status(200).send(JSON.stringify({success: true,data: {response: Response.result}}, null, 3));
      } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
        return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
      }
});
////////////////////////////////////////////////////////////////////////
//                Get list of all viajes abiertos
////////////////////////////////////////////////////////////////////////
router.get('/viajes/abiertos', jwt.ensureJWTAuth, [
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
  const [[Viajes]] = await operatorModel.getTrayectosAbiertos(data.page, data.limit,req.user.user_type_id,req.user.user_id);
  if(!Viajes) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Viajes.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes.length,viajes:Viajes}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes[0].total,viajes:Viajes}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
////////////////////////////////////////////////////////////////////////
//                Get list vehiculos matriculas
////////////////////////////////////////////////////////////////////////
router.get('/vehiculos/matriculas', jwt.ensureJWTAuth, [
  check('matricula')
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
  const [[Viajes]] = await operatorModel.getVehiculoByMatricula(data.matricula);
  if(!Viajes) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Viajes.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes.length,viajes:Viajes}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes[0].total,viajes:Viajes}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

//                Get list of all viajes abiertos
////////////////////////////////////////////////////////////////////////
router.get('/viajes/vehiculos', jwt.ensureJWTAuth, [
  check('id_viaje')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('trayectos_id')
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

  
  //Getting VIAJES
  const [[Viajes]] = await operatorModel.getVehiculosByTrayecto(data.id_viaje, data.trayectos_id,req.user.user_id,req.user.user_type_id);
  if(!Viajes) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Viajes.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes.length,viajes:Viajes}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Viajes[0].total,viajes:Viajes}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
//                Delete vehiculos
////////////////////////////////////////////////////////////////////////
router.delete('/viajes/vehiculos/eliminar', jwt.ensureJWTAuth, [
  check('id_viaje')
    .optional()
    .isInt({min:1}).withMessage('Should be an integer greater than 0'),
  check('id_vehiculo')
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

  console.log(data)
  //Getting VIAJES
  const [[Vehiculo]] = await operatorModel.deleteVehiculo(data);
  if(!Vehiculo) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Vehiculo.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Vehiculo.length,viajes:Vehiculo}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Vehiculo[0].total,viajes:Vehiculo}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
//                cerrar trayecto
////////////////////////////////////////////////////////////////////////
router.delete('/viajes/eliminar', jwt.ensureJWTAuth, [
  check('id_viaje')
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

  //Getting VIAJES
  const [[Viaje]] = await operatorModel.cerrarViaje(data.id_viaje);
  if(!Viaje) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Viaje.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Viaje.length,viajes:Viaje}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{viajes:Viaje}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"${req.user.user_id}", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});
module.exports = router;