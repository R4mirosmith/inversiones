var express = require('express');
const axios = require('axios');
var lotteryModel = require('../models/lottery.js');
var userModel = require('../models/users');
const nodemailer = require("nodemailer");
var {check,validationResult} = require('express-validator');
var {matchedData,sanitize} = require('express-validator');
const { v4: uuidv4 } = require('uuid');
var jwt = require('../services/jwt.js');
var capitalize = require('capitalize');
const mercadopago = require("mercadopago");
var momentz = require('moment-timezone');
// Establecer el token de acceso de MercadoPago

var log = require('../services/apilogger.js');
var permission = require('../services/permission.js');

var config = require('../config.js');

var router = express.Router();

const ENVIRONMENT = config.ENVIRONMENT;


////////////////////////////////////////////////////////////////////////
//                     Create an lottery
////////////////////////////////////////////////////////////////////////
router.post('/',[
  check('identification')
    .exists().withMessage('identification is required')
    .trim(),
  check('nombre')
     .isLength({ min: 1, max: 255}).withMessage('Must be between 1 and 255 characters long')
    .trim(),
  check('telefono')
    .exists().withMessage('telefono is required')
    .trim(),
  check('cantidad')
  .exists().withMessage('cantidad is required')
    .trim(),
  check('estadopayment')
    .exists().withMessage('estadopayment is required')
    .trim(),
  check('idpayment')
    .exists().withMessage('idpayment is required')
    .trim(),
  ],
  async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":""}`);

      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success: false,error: {code: 201, message: "Request has invalid data", details: errors.mapped()}}, null, 3));

      //Get matched data
      const data = matchedData(req);

      //Prepare data
      if (data.nombre) data.nombre = capitalize.words(data.nombre.toLowerCase());

      const [[[Product]]] = await lotteryModel.create(data);
      console.log(Product);
      if (!Product) return res.status(500).send(JSON.stringify({success: false,error: { code: 301, message: "Error in database", details: null}}, null, 3));
      if (Product.result === -2) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "No continues,ya no hay numeros disponibles",details: null}}, null, 3));
      // if (Product.result === -1) return res.status(500).send(JSON.stringify({success: false,error: {code: 301, message: "El número debe estar en el rango de 000 a 999",details: null}}, null, 3));

      return res.status(200).send(JSON.stringify({success: true,data: {product: Product.result}}, null, 3));
    } catch (err) {
        log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success: false,error: {code: 301,message: "Error in service or database",details: err}}, null, 3));
    }
});


////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/comprados', 
  async(req,res) => { try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":""}`);
    
    //Handle validations errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
    
    //Get matched data
    const data = matchedData(req); 
  
  
    //Getting Jornadas
    const [[cantidad]] = await lotteryModel.getAll();
    if(!cantidad) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
    if(cantidad.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:cantidad.count,numbers:cantidad}}, null, 3));
  
    
    return res.status(200).send(JSON.stringify({success:true,data:{count:cantidad[0].total,cantidad:cantidad}}, null, 3));}
  catch(err){
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
  }});

// Ruta para manejar el pago
router.post('/pago', async (req, res) => {
  try {
      const client = new mercadopago.MercadoPagoConfig({ accessToken: 'TEST-2917508713925163-090511-ae37c31035e11e7a997d066b7adb1cb7-158826293' });
      const payment = new mercadopago.Payment(client);

      const { nombre, identification, telefono, email, banco_id, cantidad } = req.body;

      console.log(req.body, "***");

      // Verifica si los datos necesarios están presentes
      if (telefono && nombre && identification && email && banco_id && cantidad > 0) {
          let name_capitalize = capitalize.words(nombre.toLowerCase());

          // Crear un objeto de pago
          const body = {
              description: `Compra de ${cantidad} números.`,
              transaction_amount: 35000 * cantidad,
              payment_method_id: "pse", // Asumiendo que usas PSE
              additional_info: {
                  ip_address: "127.0.0.1",
              },
              transaction_details: {
                  financial_institution: banco_id,
              },
              callback_url: "https://inversionesad.inletsoft.com/", // Reemplazar con tu URL de callback real
              payer: {
                  first_name: name_capitalize,
                  last_name: name_capitalize,
                  email: email,
                  identification: {
                      type: "CC",
                      number: identification
                  },
                  entity_type: "individual"
              },
              notification_url: "https://appmagdalena.net/apinversion/inversiones/webhook" // Reemplazar con tu URL de webhook real
          };

          // Generar un ID único para el idempotency key
          const idempotencyKey = Date.now().toString(); // Generar un idempotency key único
          const requestOptions = {
              idempotencyKey: idempotencyKey,
          };

          // Intentar crear el pago
          let paymentResponse = await payment.create({ body, requestOptions });
          let idpayment = paymentResponse.id;
          let estadopayment = paymentResponse.status;
          console.log(idpayment, "paymentResponse*********************");
          // console.log(paymentResponse, "paymentResponse*********************");

          // Intentar crear el producto
          const Product = await lotteryModel.create({ identification,nombre,telefono,estadopayment,idpayment,cantidad});
          console.log(Product, "Product*********************");

          if (!Product) {
              return res.status(500).send(JSON.stringify({ success: false, error: { code: 301, message: "Error en la base de datos", details: null } }, null, 3));
          }
          if (Product.result === -1) {
              return res.status(500).send(JSON.stringify({ success: false, error: { code: 301, message: "El número debe estar en el rango de 000 a 999", details: null } }, null, 3));
          }

          return res.status(200).send(JSON.stringify({ success: true, data: { response: paymentResponse } }, null, 3));
      } else {
          // Respuesta de error si los datos no están completos
          return res.status(400).json({
              status: 'error',
              message: 'Datos incompletos'
          });
      }

  } catch (error) {
      // Captura cualquier error inesperado en la operación
      console.error("Error al procesar la solicitud de pago:", error);
      return res.status(500).json({
          status: 'error',
          message: 'Hubo un error al procesar la solicitud de pago',
          details: error.message || error
      });
  }
});

// Endpoint para recibir las notificaciones del Webhook de MercadoPago
router.post('/webhook', async (req, res) => {
  try {
    const paymentId = req.body.data.id;  // MercadoPago nos envía el ID de pago
      const url = `https://api.mercadopago.com/v1/payments/search?&id=${paymentId}`;
      const headers = {
        Authorization: `Bearer TEST-0994b6e6-b435-4ca3-bd06-598ec2d0a598`,  // Usa tu token de acceso de Mercado Pago
    };

    console.log('Notificación recibida: ', req.body);

    // Aquí se pueden agregar validaciones de acuerdo con el estado del pago.
    try {
      // 4. Hacer la solicitud para obtener el estado del pago
      const response = await axios.get(url, { headers });
      const payment = response.data.results[0];
      console.log(payment,"*******INFO PAGO******");
      if (payment) {
          const { status, status_detail } = payment;
          console.log(status);
          console.log(status_detail);
          // 5. Verificar si el estado no es 'approved' o 'accredited'
          if (status !== "approved" && status !== "pending") {
              // 6. Llamar al SP para actualizar el estado
              // await promisePool.query('CALL sp_updateNumberPurchasedState(?)', [id_payment]);
              // console.log(`Estado actualizado para el pago ${id_payment}`);
          } else {
              console.log(`El pago ${paymentId} está aprobado y acreditado.`);
          }
            // Responder con OK a MercadoPago
          return res.status(200).send(JSON.stringify({ success: true, data: { response: payment } }, null, 3));
      } else {
          console.log(`No se encontraron datos de pago para el ID ${paymentId}`);
      }
  } catch (error) {
      console.error(`Error al consultar el estado del pago ${paymentId}:`, error);
  }

  
  } catch (error) {
    console.error('Error al procesar la notificación del webhook:', error);
    res.status(500).send('Error al procesar la notificación');
  }
});

////////////////////////////////////////////////////////////////////////
//                     SEND MAIL
////////////////////////////////////////////////////////////////////////
router.post('/sendmail',
    async (req,res) => { try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "body":"${JSON.stringify(req.body)}","user":""}`);
            
      //Handle validation errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
      //Get matched data
      const data = matchedData(req.body);
      let mailOptions = {};
      console.log(req.body,"************");
      console.log(data);


            let htmlCorreo =`<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notificación de Compra de Números del sorteo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header img {
                    max-width: 180px;
                }
                h2 {
                    color: #2c3e50;
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                p {
                    font-size: 16px;
                    line-height: 1.5;
                    color: #555;
                }
                .important {
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                    margin-bottom: 20px;
                }
                ul li {
                    background-color: #ecf0f1;
                    padding: 10px;
                    margin-bottom: 5px;
                    border-radius: 5px;
                }
                .footer {
                    font-size: 14px;
                    text-align: center;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
                .button {
                    display: inline-block;
                    background-color: #3498db;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    text-align: center;
                    font-weight: bold;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Cabecera con el logo -->
                <div class="header">
                    <img src="cid:logo" alt="!Melitico y ricolino¡">
                </div>

                <hr>
                <h2>Notificación de Compra de Números del sorteo</h2>
                <p>Hola ${req.body.name},</p>

                <p>Te informamos que has adquirido exitosamente los siguientes números del sorteo en Meliticoyricolino:</p>

                <!-- Lista de números de lotería -->
 
                    <!-- Lista dinámica de números -->
                    <ul>
                        ${req.body.numbers.map((num, index) => `<li>Número ${index + 1}: ${num}</li>`).join('')}
                    </ul>

                <!-- Mensaje importante -->
                <div class="important">
                    <p><strong>Importante:</strong> Si no completas el pago dentro de los siguientes <strong>15 minutos</strong>, tus números perderán su validez y serán liberados nuevamente para otros usuarios.</p>
                </div>

                <p>Te recomendamos completar el proceso de pago lo antes posible para garantizar tu participación en el sorteo. Si ya has finalizado el pago, por favor ignora este mensaje.</p>

                <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.</p>

                <p>¡Gracias por confiar en nosotros!</p>

                <div class="footer">
                    <p>Saludos cordiales,<br>El equipo de Meliticoyricolino</p>
                    <p><a href="mailto:Carlosmariopastranadoria@gmail.com">Carlosmariopastranadoria@gmail.com</a> | <a href="https://meliticoyricolino.inletsoft.com/">Visítanos</a></p>
                </div>
            </div>
        </body>
        </html>
`;
                            
  
      const transporter = nodemailer.createTransport(
        {
          host:"smtp.gmail.com",
          port:465,
          secure:true,
          auth:{
            user: "Carlosmariopastranadoria@gmail.com", 
            pass: "bnmk epcd qzgn hzln"
          }
        })
        mailOptions = {
          from: "Carlosmariopastranadoria@gmail.com",
          to:req.body.email,
          subject:"Equipo de Meliticoyricolino",
          html:htmlCorreo,
          attachments: []
    }
        
      
  
    
  
  
      //Send email
      transporter.sendMail(mailOptions,async (error,info)=>{
          if(error) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:error.message, details:null}}, null, 3));
          if(data.inspeccion_id != undefined)   await InspeccionModel.UpdateStateNotificacion(data.inspeccion_id);
          return res.status(200).send(JSON.stringify({success:true,data:{msg:"Email enviado gracias!!!"}}, null, 3));
      })
  
  
    }
    catch(err){
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/numbers/all', 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":""}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Jornadas]] = await lotteryModel.getAll();
  if(!Jornadas) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Jornadas.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas.count,numbers:Jornadas}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas[0].total,jornadas:Jornadas}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                Get list of all Jornadas
////////////////////////////////////////////////////////////////////////
router.get('/paymet/all', [
  check('numbers')
    .optional()
    .trim()
    ], 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"/paymet/all"}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Numbers]] = await lotteryModel.getlistNumbersApproved(data.numbers);
  if(!Numbers) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Numbers.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Numbers.length,numbers:Numbers}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{numbers:Numbers}}, null, 3));}
catch(err){
  log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
  return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});


////////////////////////////////////////////////////////////////////////
//               Delete pagos
////////////////////////////////////////////////////////////////////////
router.get('/checkAndUpdatePayments',
  async(req,res) => { try {
    res.setHeader('Content-Type', 'application/json');
    log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"/paymet/all"}`);
    
    //Handle validations errors
    var errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));

    //Getting Jornadas
    const Numbers= await lotteryModel.checkAndUpdatePayments();
    console.log(Numbers)
    // if(!Numbers) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
    // if(Numbers.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Numbers.length,numbers:Numbers}}, null, 3));
  
    
    return res.status(200).send(JSON.stringify({success:true,data:{numbers:Numbers}}, null, 3));}
  catch(err){
    log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
    return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
}});

////////////////////////////////////////////////////////////////////////
//                Get list of all persons
////////////////////////////////////////////////////////////////////////
router.get('/person/all', 
    async(req,res) => { try {
      res.setHeader('Content-Type', 'application/json');
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"tombola"}`);
      
      //Handle validations errors
      var errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
      
      //Get matched data
      const data = matchedData(req); 
    
    
      //Getting Jornadas
      const [[Person]] = await lotteryModel.getAllPerson();
      if(!Person) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
      if(Person.length===0) return res.status(200).send(JSON.stringify({success:true,data:{person:Person}}, null, 3));
    
      
      return res.status(200).send(JSON.stringify({success:true,data:{count:Person[0].total,person:Person}}, null, 3));}
    catch(err){
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
      return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in service or database", details:err}}, null, 3));
    }});




  module.exports = router;