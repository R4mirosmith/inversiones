var db = require('../db/db.js');


exports.getAll = () => {
  //Checking data

  var values = [];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_GetJornadasActivas()', values);
}
exports.getVehicleType = () => {
  //Checking data

  var values = [];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_getVehicleType()', values);
}
exports.post = (data) => {
  //Checking data
if(!data.driver_id || data.driver_id == null || data.driver_id == undefined ) data.driver_id  = 1111111111;
if(data.driver_name == '' || data.driver_name == null || data.driver_name == undefined) data.driver_name ='Cliente Estandar';
  var values = [
    data.driver_name,
    data.driver_phone,
    data.driver_email,
    data.driver_id,
    data.vehicle_type_id,
    data.vehicle_license,
    data.trailer_license,
    data.fecha_crea,
    data.hora,
    data.journey_id,
    data.user_id,
    data.trayecto,
    data.id_viaje,
    data.image
  ];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_InsertarDatos(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', values);
}
exports.Opentrayecto = (data,usuario_id) => {
  //Checking data
  var values = [
    data.trayecto_id,
    data.fecha_crea,
    usuario_id
  ];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_abrirTrayecto(?, ?, ?);', values);
}
exports.put = (id_factura) => {
  //Checking data

  var values = [
    id_factura
  ];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_MarcarFacturaElectronica(?)', values);
}
exports.countAll = (filter) => {
  //Checking data
  if (filter === undefined) filter = null;
  var values = [filter];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Patient_countAll(?)', values);
}

exports.getFacturaDetalleById = (id) => {
  //Checking data

  var values = [id];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_ObtenerFacturaDetalle(?)', values);
}
exports.getTrayectosAbiertos = (page,limit,user_type_id,user_id) => {
  //Checking data
  if (page === undefined) page = null;
  if (limit === undefined) limit = null;


  var values = [page,limit,user_id];
  // query database using promises
  const promisePool = db.get().promise();
  if(user_type_id == 1) return promisePool.query('CALL strp_getViajesTrayectosAdmin(?, ?)', values);
  else
  return promisePool.query('CALL strp_getViajesTrayectos(?, ?, ?)', values);
}
exports.getVehiculosByTrayecto = (id_viaje,trayectos_id,user_id,user_type_id) => {
  //Checking data
  if (id_viaje === undefined) id_viaje = null;
  if (trayectos_id === undefined) trayectos_id = null;

  var values = [id_viaje,trayectos_id];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_buscar_viajes(?, ?)', values);
}
exports.getVehiculoByMatricula = (matricula) => {
  //Checking data
  if (matricula === undefined) matricula = null;

  var values = [matricula];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_GetVehiculosByMatricula(?)', values);
}
exports.getVehiculoByMatricula = (matricula) => {
  //Checking data
  if (matricula === undefined) matricula = null;

  var values = [matricula];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_GetVehiculosByMatricula(?)', values);
}

exports.deleteVehiculo = (data) => {
  //Checking data
  if (data.id_viaje === undefined) data.id_viaje = null;
  if (data.id_vehiculo === undefined) data.id_vehiculo = null;

  var values = [data.id_viaje,data.id_vehiculo];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_actualizar_estado_vehiculo_viaje(?,?)', values);
}
exports.cerrarViaje = (id_viaje) => {
  //Checking data
  if (id_viaje === undefined) id_viaje = null;
  
  var values = [id_viaje];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_actualizar_estado_viaje(?)', values);
}