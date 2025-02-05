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
  return promisePool.query('CALL strp_Optometrist_getAll(?,?,?,?,?)', values);
}
exports.countAll = (filter) => {
  //Checking data
  if (filter === undefined) filter = null;
  var values = [filter];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Optometrist_countAll(?)', values);
}
exports.getByUser = async (userId) => {
  //Checking data
  if (userId === undefined) userId = "";
  var values = [userId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Optometrist_getByUser(?)', values);
}

exports.getById = async (optometristId) => {
  //Checking data
  if (optometristId === undefined) optometristId = "";
  var values = [optometristId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Optometrist_getById(?)', values);
}

exports.checkBelonging = async (opticalshopId,optometristId) => {
  //Checking data
  if (opticalshopId === undefined) opticalshopId = "";
  if (optometristId === undefined) optometristId = "";
  var values = [opticalshopId,optometristId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Optometrist_checkBelonging(?,?)', values);
}

exports.checkUser = async (userId) => {
  //Checking data
  if (userId === undefined) userId = "";
  var values = [userId];
  // query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Optometrist_checkUser(?)', values);
}

exports.post = async (user_id, optical_shop_id,identification_card,identification_card_document, professional_card, professional_card_document) => {
  //Prepare variables
  if (user_id == undefined) user_id = "";
  if (optical_shop_id == undefined) optical_shop_id = "";
  if (identification_card == undefined) identification_card = "";
  if (identification_card_document == undefined) identification_card_document = "";
  if (professional_card == undefined) professional_card = "";
  if (professional_card_document == undefined) professional_card_document = "";
 
  var values = [user_id, optical_shop_id,identification_card,identification_card_document, professional_card, professional_card_document];
  //query database using promises
  const promisePool = db.get().promise();
  return promisePool.query('CALL strp_Optometrist_post(?,?,?,?,?,?)', values);
}