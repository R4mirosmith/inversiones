var db = require('../db/db.js');

exports.getBusinessTypes = () => {
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_getBusinessTypes()');
}
exports.getAll = (page,limit) => {
  //Checking data
  if (page === undefined) page = null;
  if (limit === undefined) limit = null;


  var values = [page,limit];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Jornadas_getAll(?, ?)', values);
}
exports.getGastosOperacionalesAll = (fecha_ini) => {
  //Checking data
  if (fecha_ini === undefined) fecha_ini = null;

  var values = [fecha_ini];
  // query database using promises
  const promisePool = db.get().promise();
  if(fecha_ini == null || fecha_ini == '') return promisePool.query('CALL strp_obtener_ingresosAll()');
  return promisePool.query('CALL strp_obtener_ingresos_gastos_por_fecha(?)', values);
}
exports.getAllIngresosByFechas = (fecha_ini,fecha_fin) => {
  //Checking data
  if (fecha_ini === undefined) fecha_ini = null;
  if (fecha_fin === undefined) fecha_fin = null;

  var values = [fecha_ini,fecha_fin];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Admin_obtener_total_por_fecha(?, ?)', values);
}
exports.getAllVehiculos = (page,limit) => {
  //Checking data
  if (page === undefined) page = null;
  if (limit === undefined) limit = null;


  var values = [page,limit];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Vehiculos_getAll(?, ?);', values);
}
exports.getFerryAll = () => {
  //Checking data
  var values = [];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Ferrys_GetAll()', values);
}
exports.getVehiculoById = (id_vehiculo) => {
  //Checking data
  var values = [id_vehiculo];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_GetVehicleInfo(?)', values);
}
exports.getTrayectos = () => {
  //Checking data
  var values = [];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_GetTrayectos()', values);
}
exports.getTipoAdminVehiculo = (page,limit) => {
  //Checking data
  var values = [page,limit];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Admin_ListTipoVehiculos(?,?);', values);
}

exports.countAll = (filter) => {
  //Checking data
  if (filter === undefined) filter = null;
  var values = [filter];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_User_countAll(?)', values);
}
exports.getByUser = async (userId) => {
  //Checking data
  if (userId === undefined) userId = "";
  var values = [userId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_getByUser(?)', values);
}
exports.getById = async (opticalshopId) => {
  //Checking data
  if (opticalshopId === undefined) opticalshopId = "";
  var values = [opticalshopId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_getById(?)', values);
}
exports.checkUser = async (userId) => {
  //Checking data
  if (userId === undefined) userId = "";
  var values = [userId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_checkUser(?)', values);
}
exports.delete = async (opticalshopId) => {
  var values = [opticalshopId];
  if (opticalshopId === undefined) opticalshopId = "";
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_delete(?)', values);
}
exports.insertarGastoOperacional = async (monto_total_periodo, fecha_inicial, fecha_final, descripcion_gasto_operacional, total_gasto_operacional, usuario_id) => {
  // Preparamos las variables (puedes agregar validaciones si es necesario)
  if (monto_total_periodo == undefined) monto_total_periodo = 0;
  if (fecha_inicial == undefined) fecha_inicial = "";
  if (fecha_final == undefined) fecha_final = "";
  if (descripcion_gasto_operacional == undefined) descripcion_gasto_operacional = "";
  if (total_gasto_operacional == undefined) total_gasto_operacional = 0;
  if (usuario_id == undefined) usuario_id = "";

  // Preparamos los valores a pasar al SP
  var values = [monto_total_periodo, fecha_inicial, fecha_final, descripcion_gasto_operacional, total_gasto_operacional, usuario_id];

  // Usamos promisePool para ejecutar la consulta
  const promisePool = db.get().promise();
  return promisePool.query('CALL sp_InsertarGastoOperacional(?, ?, ?, ?, ?, ?)', values);
};

exports.postTipoVehiculo = async (tipo_vehiculo,p_tarifa,p_usuario_id) => {
  //Prepare variables

  if (tipo_vehiculo == undefined) tipo_vehiculo = "";
  if (p_tarifa == undefined) p_tarifa = "";
  if (p_usuario_id == undefined) p_usuario_id = "";
  var values = [tipo_vehiculo,p_tarifa,p_usuario_id];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_InsertarTipoVehiculo(?,?,?)', values);
}
exports.putTipoVehiculo = async (id_tipo_vehiculo,p_tarifa,p_usuario_id) => {
  //Prepare variables

  if (id_tipo_vehiculo == undefined) id_tipo_vehiculo = "";
  if (p_tarifa == undefined) trayecto = "";
  if (p_usuario_id == undefined) p_usuario_id = "";
  var values = [id_tipo_vehiculo,p_tarifa,p_usuario_id];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Admin_updateTarifa(?,?,?)', values);
}
exports.putStatusUser = async (id_usuario,estado) => {
  //Prepare variables

  if (id_usuario == undefined) id_usuario = "";
  if (estado == undefined) estado = "";
  var values = [id_usuario,estado];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_User_updateEstadoUsuario(?,?)', values);
}
exports.putStatusjornada = async (id_jornada,estado) => {
  //Prepare variables

  if (id_jornada == undefined) id_jornada = "";
  if (estado == undefined) estado = "";
  var values = [id_jornada,estado];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_AminUpdateEstadoJornada(?,?)', values);
}
exports.putDeleteTrayectos = async (id_viaje,is_delete) => {
  //Prepare variables

  if (id_viaje == undefined) id_viaje = 0;
  if (is_delete == undefined) is_delete = 0;
  var values = [id_viaje,is_delete];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_deleteTrayecto(?,?)', values);
}

exports.patch = async (optical_shop_id, details, icon_image, business_type_id, identification_card, identification_card_document, business_name, nit, lr_name, lr_phone, lr_email, lr_identification_card, lr_identification_card_document, rut_document, commerce_chamber_document) => {
    //Checking data
    if (optical_shop_id == undefined) optical_shop_id = null;
    if (details == undefined) details = null;
    if (icon_image == undefined) icon_image = null;
    if (business_type_id == undefined) business_type_id = null;
    if (identification_card == undefined) identification_card = null;
    if (identification_card_document == undefined) identification_card_document = null;
    if (business_name == undefined) business_name = null;
    if (nit == undefined) nit = null;
    if (lr_name == undefined) lr_name = null;
    if (lr_phone == undefined) lr_phone = null;
    if (lr_email == undefined) lr_email = null;
    if (lr_identification_card == undefined) lr_identification_card = null;
    if (lr_identification_card_document == undefined) lr_identification_card_document = null;
    if (rut_document == undefined) rut_document = null;
    if (commerce_chamber_document == undefined) commerce_chamber_document = null;
    
    var values = [optical_shop_id, details, icon_image, business_type_id, identification_card, identification_card_document, business_name, nit, lr_name, lr_phone, lr_email, lr_identification_card, lr_identification_card_document, rut_document, commerce_chamber_document];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_OpticalShop_patch(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', values);
}

exports.editImage = async(optical_shop_id,icon_image,value)=>{
  if (optical_shop_id == undefined) optical_shop_id = "";
  if (icon_image == undefined) icon_image = "";
  if (value == undefined) value = "";

  var values = [optical_shop_id,icon_image,value];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_editImage(?,?,?)', values);
}

exports.editDocument = async(optical_shop_id,document,value)=>{
  if (optical_shop_id == undefined) optical_shop_id = "";
  if (document == undefined) document = "";
  if (value == undefined) value = "";

  var values = [optical_shop_id,document,value];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_OpticalShop_editDocument(?,?,?)', values);
}

exports.post = async (id_ferry,fecha_inicio,fecha_fin,usuario_id) => {
  //Prepare variables

  if (id_ferry == undefined) id_ferry = "";
  if (fecha_inicio == undefined) fecha_inicio = "";
  if (fecha_fin == undefined) fecha_fin = "";
  if (usuario_id == undefined) usuario_id = "";
  var values = [id_ferry,fecha_inicio,fecha_fin,usuario_id];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_CrearTrayectoJornada(?,?,?,?)', values);
}