var db = require('../db/db.js');

exports.loginUser = (email,password) => {
    //query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL sp_Login(?,?)',[email,password]);
}

exports.incrementLoginCount = (userId) => {
    //Checking data
    if (userId == undefined) userId = "";
    var values = [userId];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_Login_incrementLoginCount(?)', values);
}