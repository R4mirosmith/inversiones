var express = require('express');
const axios = require('axios');
var lotteryModel = require('../models/lottery.js');
const nodemailer = require("nodemailer");
var {check,validationResult, body} = require('express-validator');
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

router.get('/transacition/:paymentId', 
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
      const client = new mercadopago.MercadoPagoConfig({ accessToken: 'APP_USR-1720038210969834-031116-5cb0590b9a1ceaa3381d37d8ddfcf897-2322508646' });
      const payment = new mercadopago.Payment(client);

      const { nombre, identification, telefono, email, banco_id, cantidad} = req.body;
      console.log(req.body, "body*********************");
      // Verifica si los datos necesarios están presentes
      if (telefono && nombre && identification && email && banco_id && cantidad > 0) {
        console.log(cantidad, "cantidad*********************");
          // Llamamos al procedimiento almacenado spobtenerCantidadComprada para obtener la cantidad de números comprados hasta ahora
          const [[[response]]] = await lotteryModel.getAll() // Aquí deberías llamar a tu SP, que debería retornar la cantidad comprada actual
          
          // console.log(response.cantidad_comprada, "response*********************");
          const limite = 1000;
          const cantidadDisponible = limite - response.cantidad_comprada;
  
          // Validar si la cantidad solicitada excede la cantidad disponible
          if (cantidad > cantidadDisponible) {
              return res.status(400).json({
                  status: 'error',
                  message: cantidadDisponible == 0 ? 'No hay números disponibles' : `Solo quedan ${cantidadDisponible} números disponibles debes cambiar la cantidad de números a comprar.`
              });
          }
          
          let name_capitalize = capitalize.words(nombre.toLowerCase());
          // Crear un objeto de pago
          const body = {
              description: `Compra de ${cantidad} números.`,
              transaction_amount: 35000 * cantidad,
              payment_method_id: "pse", // Asumiendo que usas PSE
              callback_url: "https://appmagdalena.net/apinversion/inversiones/numbers", // Reemplazar con tu URL de callback real
              payer: {
                entity_type: "individual",
                first_name: name_capitalize,
                email: email,
                identification: {
                    type: "CC",
                    number: identification
                },
                address: {
                  zip_code: "050015",
                  street_name: "Calle 41",
                  street_number: "97",
                  neighborhood: "La candelaria",
                  city: "Medellín"
              }
            },  
            
              additional_info: {
                  ip_address: "127.0.0.1",
              },
              transaction_details: {
                  financial_institution: banco_id,
              },

              notification_url:"https://appmagdalena.net/apinversion/inversiones/webhook?body="+JSON.stringify({
                  nombre: nombre,
                  identification: identification,
                  telefono: telefono,
                  email: email,
                  cantidad: cantidad
                }),
                 // Reemplazar con tu URL de webhook real
          };
      console.log(body, "body*********************");
          // Generar un ID único para el idempotency key
          const idempotencyKey = Date.now().toString(); // Generar un idempotency key único
          const requestOptions = {
              idempotencyKey: idempotencyKey,
          };

          // Intentar crear el pago
          let paymentResponse = await payment.create({ body, requestOptions });
          let idpayment = paymentResponse.id;
          // console.log(idpayment, "paymentResponse*********************");
   
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


// Función para obtener la cantidad de números comprados (esta debe hacer la consulta a la base de datos)
async function obtenerCantidadComprada() {
  // Aquí deberías realizar la llamada a tu SP para obtener la cantidad de números comprados
  // Por ejemplo:
  const result = await db.query('CALL spobtenerCantidadComprada()'); // Esto depende de tu DB y el SP
  return result[0].cantidad_comprada; // Ajusta esto según el nombre de la columna que devuelva el SP
}

// Endpoint para recibir las notificaciones del Webhook de MercadoPago
router.post('/webhook', async (req, res) => {
  try {

    let body = JSON.parse(req.query.body);

    // Primero intentamos obtener el paymentId desde req.body.data.id
    let paymentId = req.body.data ? req.body.data.id : null;

    // Si no existe el paymentId en req.body.data.id, utilizamos el valor de 'resource'
    if (!paymentId && req.body.resource) {
       paymentId = req.body.resource; // Usamos el valor de 'resource' como paymentId
    }

    const { identification, nombre,telefono,email,cantidad} = body;

    // console.log(paymentId, "webhook*********************");
    // console.log(req.body.data.id, "req.body.id*********************");
      const url = `https://api.mercadopago.com/v1/payments/search?&id=${paymentId}`;
      const headers = {
        Authorization: `Bearer APP_USR-1720038210969834-031116-5cb0590b9a1ceaa3381d37d8ddfcf897-2322508646`,  // Usa tu token de acceso de Mercado Pago
    };

    // console.log('Notificación recibida: ', req.body);

    // Aquí se pueden agregar validaciones de acuerdo con el estado del pago.
    try {
      // 4. Hacer la solicitud para obtener el estado del pago
      const response = await axios.get(url, { headers });
      const payment = response.data.results[0];

      // console.log("//////////////////payment/////////////////////");
      // console.log(payment);
      // console.log("///////////////////////////////////////");
      if (payment) {
          const { status, status_detail } = payment;
        

          if(status == "approved" && status_detail == "accredited"){
          // if(true){

            // Intentar crear el producto
               const [[[existe]]] = await lotteryModel.getExistePago(paymentId);
               console.log(existe, "existe*********************");
               console.log(existe.existe_pago, "existe*********************");
               if(existe.existe_pago  == 0 ){
                console.log('El pago no existe, se procederá a crear el registro.',existe.existe_pago);
               const Response = await lotteryModel.create({ identification,nombre,telefono,status,paymentId,cantidad,email});
               console.log(Response, "Response*********************");
                  if (!Response) {
                      return res.status(500).send(JSON.stringify({ success: false, error: { code: 301, message: "Error en la base de datos", details: null } }, null, 3));
                  }

                  // console.log(`El pago ${paymentId} está aprobado y acreditado.`);
              const { Resend } = require('resend');

              (async () => {
                const [[numbers]] = await lotteryModel.getNumbersComprados(paymentId);
                console.log(numbers, "numbers*********************");
                // Importación dinámica de node-fetch solo para evitar el error
                const { default: fetch, Headers } = await import('node-fetch');

                globalThis.fetch = fetch;
                globalThis.Headers = Headers;

                const resend = new Resend('re_e2ZFuk53_6XAWfZGQ8NPukQ9LBHyaro4e');
                const totalCompra = cantidad * 35000;

                const { data, error } = await resend.emails.send({
                  from: 'InversionesA&D <inversiones@inversionesayd.inletsoft.com>',
                  to: email,
                  subject: `Hola, ${nombre}, tu compra ha sido exitosa`,
                 html: `
                      <!DOCTYPE html>
                      <html lang="es">
                      <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Detalles de la Compra</title>
                          <style>
                              body {
                                  font-family: Arial, sans-serif;
                                  margin: 0;
                                  padding: 0;
                                  background-color: #f4f4f4;
                              }
                              .email-container {
                                  max-width: 600px;
                                  margin: 0 auto;
                                  background-color: #ffffff;
                                  padding: 20px;
                                  border-radius: 8px;
                                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                              }
                              .banner {
                                  width: 100%;
                                  height: auto;
                                  border-radius: 8px 8px 0 0;
                              }
                              .content {
                                  margin-top: 20px;
                              }
                              .content h2 {
                                  color: #2c3e50;
                                  font-size: 24px;
                                  margin-bottom: 20px;
                              }
                              .content p {
                                  font-size: 16px;
                                  color: #555;
                              }
                              table {
                                  width: 100%;
                                  margin-top: 20px;
                                  border-collapse: collapse;
                                  margin-bottom: 30px;
                              }
                              table th, table td {
                                  padding: 12px;
                                  text-align: left;
                                  border: 1px solid #ddd;
                              }
                              table th {
                                  background-color: #a61e2a;
                                  color: white;
                              }
                              table tr:nth-child(even) {
                                  background-color: #f2f2f2;
                              }
                              .footer {
                                  margin-top: 40px;
                                  font-size: 12px;
                                  color: #888;
                                  text-align: center;
                              }
                          </style>
                      </head>
                      <body>
                          <div class="email-container">
                              <!-- Banner Image -->
                              <img src="https://appmagdalena.net/apinversion/banner" alt="Banner" class="banner">

                              <!-- Content -->
                              <div class="content">
                                  <h2>Detalles de la Compra</h2>

                                  <!-- Table with Purchase Details -->
                                  <table>
                                      <tr>
                                          <th>Campo</th>
                                          <th>Detalle</th>
                                      </tr>
                                      <tr>
                                          <td><strong>Identificación:</strong></td>
                                          <td>${identification}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Nombre:</strong></td>
                                          <td>${nombre}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Teléfono:</strong></td>
                                          <td>${telefono}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Email:</strong></td>
                                          <td>${email}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Cantidad de Números Comprados:</strong></td>
                                          <td>${cantidad}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Total de la Compra:</strong></td>
                                          <td>${totalCompra.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                      </tr>
                                  </table>
                              </div>

                              <!-- Numbers List -->
                              <div class="numbers-list">
                                  <h3>Números Comprados</h3>

                                  <!-- Table with Purchased Numbers -->
                                  <table>
                                      <tr>
                                          <th>Número</th>
                                      </tr>
                                      ${numbers.map(num => `<tr><td>${num.numero}</td></tr>`).join('')}
                                  </table>
                              </div>

                              <!-- Footer -->
                              <div class="footer">
                                  <p>Gracias por confiar en nosotros para realizar tu compra. Si tienes alguna pregunta, no dudes en contactarnos.</p>
                                  <p>&copy; 2025 Inversiones A&D. Todos los derechos reservados.</p>
                              </div>
                          </div>
                      </body>
                      </html>
                  `,
                });

                if (error) {
                  return console.error({ error });
                }

                console.log({ data });
              })();


              // console.log(`Estado actualizado para el pago ${id_payment}`);
          } else {
              // console.log(`El pago ${paymentId} está aprobado y acreditado.`);
          }
            // Responder con OK a MercadoPago
          return res.status(200).send(JSON.stringify({ success: true, data: { response: payment } }, null, 3));
        }
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

//   try {
//     // Parsear el cuerpo de la solicitud si viene en la query
//     let body = req.query.body ? JSON.parse(req.query.body) : {};

//     // Obtener el paymentId desde req.body.data.id o req.body.resource
//     let paymentId = req.body?.data?.id || req.body?.resource;

//     // Extraer información del cuerpo
//     const { identification, nombre, telefono, email, cantidad } = body;

//     // Construir la URL para consultar el estado del pago
//     const url = `https://api.mercadopago.com/v1/payments/search?id=${paymentId}`;
//     const headers = {
//       Authorization: `Bearer APP_USR-1720038210969834-031116-5cb0590b9a1ceaa3381d37d8ddfcf897-2322508646`,
//     };

//     // Consultar el estado del pago
//     const response = await axios.get(url, { headers });
//     const payment = response.data.results[0];

//     if (payment) {
//       const { status, status_detail } = payment;

//       // Verificar si el pago está aprobado y acreditado
//       if (true) {
//       // if (status === 'approved' && status_detail === 'accredited') {
//         // Verificar si el pago ya existe en la base de datos
//         const [[[existe]]] = await lotteryModel.getExistePago(paymentId);

//         if (existe.existe_pago === 0) {
//           console.log('El pago no existe, se procederá a crear el registro.',existe.existe_pago);
//           console.log('El pago no existe, se procederá a crear el registro.',existe);
//           // Crear el registro del pago en la base de datos
//           const Response = await lotteryModel.create({
//             identification,
//             nombre,
//             telefono,
//             status,
//             paymentId,
//             cantidad,
//             email,
//           });

//           if (!Response) {
//             return res.status(500).json({
//               success: false,
//               error: {
//                 code: 301,
//                 message: 'Error en la base de datos',
//                 details: null,
//               },
//             });
//           }

//           // Obtener los números comprados
//           const [[numbers]] = await lotteryModel.getNumbersComprados(paymentId);
//           const { Resend } = require('resend');
//           // Enviar correo electrónico de confirmación
//           const resend = new Resend('re_3G8p1JaW_Nmvs5YEQuNg44hfHdTsSifh3');

//           const { data, error } = await resend.emails.send({
//             from: 'InversionesA&D <inversiones@inversionesayd.inletsoft.com>',
//             to: email,
//             subject: `Hola, ${nombre}, tu compra ha sido exitosa`,
//             html: `
//               <!DOCTYPE html>
//               <html lang="es">
//               <head>
//                   <meta charset="UTF-8">
//                   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                   <title>Detalles de la Compra</title>
//                   <style>
//                       body {
//                           font-family: Arial, sans-serif;
//                           margin: 0;
//                           padding: 0;
//                           background-color: #f4f4f4;
//                       }
//                       .email-container {
//                           max-width: 600px;
//                           margin: 0 auto;
//                           background-color: #ffffff;
//                           padding: 20px;
//                           border-radius: 8px;
//                           box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//                       }
//                       .banner {
//                           width: 100%;
//                           height: auto;
//                           border-radius: 8px 8px 0 0;
//                       }
//                       .content {
//                           margin-top: 20px;
//                       }
//                       .content h2 {
//                           color: #2c3e50;
//                           font-size: 24px;
//                           margin-bottom: 20px;
//                       }
//                       .content p {
//                           font-size: 16px;
//                           color: #555;
//                       }
//                       table {
//                           width: 100%;
//                           margin-top: 20px;
//                           border-collapse: collapse;
//                           margin-bottom: 30px;
//                       }
//                       table th, table td {
//                           padding: 12px;
//                           text-align: left;
//                           border: 1px solid #ddd;
//                       }
//                       table th {
//                           background-color: #3498db;
//                           color: white;
//                       }
//                       table tr:nth-child(even) {
//                           background-color: #f2f2f2;
//                       }
//                       .footer {
//                           margin-top: 40px;
//                           font-size: 12px;
//                           color: #888;
//                           text-align: center;
//                       }
//                   </style>
//               </head>
//               <body>
//                   <div class="email-container">
//                       <!-- Banner Image -->
//                       <img src="https://appmagdalena.net/apinversion/banner" alt="Banner" class="banner">

//                       <!-- Content -->
//                       <div class="content">
//                           <h2>Detalles de la Compra</h2>

//                           <!-- Table with Purchase Details -->
//                           <table>
//                               <tr>
//                                   <th>Campo</th>
//                                   <th>Detalle</th>
//                               </tr>
//                               <tr>
//                                   <td><strong>Identificación:</strong></td>
//                                   <td>${identification}</td>
//                               </tr>
//                               <tr>
//                                   <td><strong>Nombre:</strong></td>
//                                   <td>${nombre}</td>
//                               </tr>
//                               <tr>
//                                   <td><strong>Teléfono:</strong></td>
//                                   <td>${telefono}</td>
//                               </tr>
//                               <tr>
//                                   <td><strong>Email:</strong></td>
//                                   <td>${email}</td>
//                               </tr>
//                               <tr>
//                                   <td><strong>Cantidad de Números Comprados:</strong></td>
//                                   <td>${cantidad}</td>
//                               </tr>
//                           </table>
//                       </div>

//                       <!-- Numbers List -->
//                       <div class="numbers-list">
//                           <h3>Números Comprados</h3>

//                           <!-- Table with Purchased Numbers -->
//                           <table>
//                               <tr>
//                                   <th>Número</th>
//                               </tr>
//                               ${numbers.map(num => `<tr><td>${num.numero}</td></tr>`).join('')}
//                           </table>
//                       </div>

//                       <!-- Footer -->
//                       <div class="footer">
//                           <p>Gracias por confiar en nosotros para realizar tu compra. Si tienes alguna pregunta, no dudes en contactarnos.</p>
//                           <p>&copy; 2025 Inversiones A&D. Todos los derechos reservados.</p>
//                       </div>
//                   </div>
//               </body>
//               </html>
//             `,
//           });

//           if (error) {
//             console.error('Error al enviar el correo:', error);
//           } else {
//             console.log('Correo enviado:', data);
//           }
//         }
//       }
//       // Responder con OK a MercadoPago
//       return res.status(200).json({ success: true, data: { response: payment } });
//     } else {
//       console.log(`No se encontraron datos de pago para el ID ${paymentId}`);
//       return res.status(404).json({ success: false, message: 'Pago no encontrado' });
//     }
//   } catch (error) {
//     console.error('Error al procesar la notificación del webhook:', error);
//     return res.status(500).send('Error al procesar la notificación');
//   }
// });

////////////////////////////////////////////////////////////////////////
//                     SEND MAIL
////////////////////////////////////////////////////////////////////////

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
//                Get list of all number compras
////////////////////////////////////////////////////////////////////////
router.get('/compras/all', 
async(req,res) => { try {
  res.setHeader('Content-Type', 'application/json');
  log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":""}`);
  
  //Handle validations errors
  var errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send(JSON.stringify({success:false,error:{code:201, message:"Request has invalid data",details:errors.mapped()}}, null, 3));
  
  //Get matched data
  const data = matchedData(req); 


  //Getting Jornadas
  const [[Jornadas]] = await lotteryModel.getcomprasAll();
  if(!Jornadas) return res.status(500).send(JSON.stringify({success:false,error:{code:301,message:"Error in database", details:null}}, null, 3));
  if(Jornadas.length===0) return res.status(200).send(JSON.stringify({success:true,data:{count:Jornadas.count,numbers:Jornadas}}, null, 3));

  
  return res.status(200).send(JSON.stringify({success:true,data:{jornadas:Jornadas}}, null, 3));}
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

////////////////////////////////////////////////////////////////////////
//                Get list of all persons
////////////////////////////////////////////////////////////////////////


router.get('/numbers',
  async (req, res) => {
    try {
      log.logger.info(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"tombola"}`);
      
          // Primero intentamos obtener el paymentId desde req.body.data.id
            const paymentId = req.query.payment_id;
//  console.log(req, "req*********************");
      const [[Numbers]] = await lotteryModel.getAllNumbersByguid(paymentId);

      if (!Numbers || Numbers.length === 0) {
        return res.status(404).send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Compra No Exitosa</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .banner {
      width: 100%;
      border-radius: 8px 8px 0 0;
    }
    h2 {
      color: #a61e2a;
      margin-top: 20px;
    }
    p {
      font-size: 16px;
      color: #555;
      margin-top: 15px;
    }
    .btn {
      margin-top: 25px;
      display: inline-block;
      padding: 12px 24px;
      background-color: #a61e2a;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <img src="https://appmagdalena.net/apinversion/banner" alt="Banner" class="banner" />
    <h2>No se pudo realizar la compra</h2>
    <a href="https://inversionesayd.inletsoft.com/" class="btn">Volver a intentarlo</a>
  </div>
</body>
</html>
`);
      }

      const html = generarFacturaHTML(Numbers);
      res.set('Content-Type', 'text/html');
      return res.status(200).send(html);

    } catch (err) {
      log.logger.error(`{"verb":"${req.method}", "path":"${req.baseUrl + req.path}", "params":"${JSON.stringify(req.params)}", "query":"${JSON.stringify(req.query)}", "body":"${JSON.stringify(req.body)}","user":"", "error":"${err}"}`);
      return res.status(500).send('<p>Error en el servicio o base de datos.</p>');
    }
  }
);



const generarFacturaHTML = (data) => {
  if (!data || data.length === 0) return '<p>No se encontró información para ese GUID.</p>';

  const { nombre, identificacion, telefono, email } = data[0];
  const numbers = data.map(d => ({ numero: d.numero }));
  const cantidad = numbers.length;
  const totalCompra = cantidad * 35000;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detalles de la Compra</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .banner {
                width: 100%;
                height: auto;
                border-radius: 8px 8px 0 0;
            }
            .content {
                margin-top: 20px;
            }
            .content h2 {
                color: #2c3e50;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content p {
                font-size: 16px;
                color: #555;
            }
            table {
                width: 100%;
                margin-top: 20px;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            table th, table td {
                padding: 12px;
                text-align: left;
                border: 1px solid #ddd;
            }
            table th {
                background-color: #a61e2a;
                color: white;
            }
            table tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .footer {
                margin-top: 40px;
                font-size: 12px;
                color: #888;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Banner Image -->
            <img src="https://appmagdalena.net/apinversion/banner" alt="Banner" class="banner">

            <!-- Content -->
            <div class="content">
                <h2>Detalles de la Compra</h2>

                <!-- Table with Purchase Details -->
                <table>
                    <tr><th>Campo</th><th>Detalle</th></tr>
                    <tr><td><strong>Identificación:</strong></td><td>${identificacion}</td></tr>
                    <tr><td><strong>Nombre:</strong></td><td>${nombre}</td></tr>
                    <tr><td><strong>Teléfono:</strong></td><td>${telefono || '-'}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${email || '-'}</td></tr>
                    <tr><td><strong>Cantidad de Números Comprados:</strong></td><td>${cantidad}</td></tr>
                    <tr><td><strong>Total de la Compra:</strong></td><td>$${totalCompra.toLocaleString('es-CO')}</td></tr>
                </table>
            </div>

<!-- Numbers List -->
<div class="numbers-list">
    <h3>Números Comprados</h3>
    <table>
        <tr><th>Número</th></tr>
        ${numbers.map(num => `<tr><td>${num.numero}</td></tr>`).join('')}
    </table>
</div>

<!-- Botón de seguir comprando -->
<div style="text-align: center; margin-top: 20px;">
    <a href="https://inversionesayd.inletsoft.com/"
       style="display: inline-block;
              background-color: #a61e2a;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;">
        Seguir comprando
    </a>
</div>

<!-- Footer -->
<div class="footer">
    <p>Gracias por confiar en nosotros para realizar tu compra. Si tienes alguna pregunta, no dudes en contactarnos.</p>
    <p>&copy; 2025 Inversiones A&D. Todos los derechos reservados.</p>
</div>

        </div>
    </body>
    </html>
  `;
};


  module.exports = router;