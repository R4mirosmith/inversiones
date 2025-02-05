var db = require('../db/db.js');
exports.getAll = () => {
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL sp_get_categories()');
}