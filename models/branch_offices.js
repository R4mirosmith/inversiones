var db = require('../db/db.js');


exports.getAll = (limit, offset, order_by, order, filter) => {
  //Checking data
  if (limit === undefined) limit = null;
  if (offset === undefined) offset = null;
  if (order_by === undefined) order_by = null;
  if (order === undefined) order = null;
  if (filter === undefined) filter = null;

  var values = [limit, offset, order_by, order, filter];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_BranchOffice_getAll(?,?,?,?,?)', values);
}
exports.countAll = (filter) => {
  //Checking data
  if (filter === undefined) filter = null;
  var values = [filter];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_BranchOffice_countAll(?)', values);
}