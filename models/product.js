var db = require('../db/db.js');
exports.create = (body) => {
var values = [
    body.p_nombre_producto, 
    body.p_id_categoria, 
    body.p_descripcion, 
    body.p_precio_unitario, 
    body.p_stock_actual, 
    body.p_umbral_minimo
];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL sp_create_product(?,?,?,?,?,?)',values);
}


exports.getAll = (page,limit) => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL get_all_products(?,?)',  [page,limit]);
}