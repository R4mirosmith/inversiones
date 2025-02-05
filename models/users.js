var db = require('../db/db.js');


exports.getTypes = () => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_getTypes()');
}
exports.getAccountTypes = () => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_getAccountTypes()');
}

exports.getAll = (page,limit,  orderby, order, filter) => {
    //Checking data
    if (page === undefined) page = 1;
    if (limit === undefined) limit = 10;
    // if (offset === undefined) offset = null;
    if (orderby === undefined) orderby = null;
    if (order === undefined) order = null;
    if (filter === undefined) filter = null;

    var values = [page,limit];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_getAll(?,?)', values);
}

exports.countAll = (filter) => {
    //Checking data
    if (filter === undefined) filter = null;
    var values = [filter];
    //query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_countAll(?)', values);
}

exports.getById = async (userId) => {
    //Checking data
    if (userId === undefined) userId = "";
    var values = [userId];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_getById(?)', values);
}
exports.getByNcEmail = async (nc_email) => {
    //Checking data
    if (nc_email === undefined) nc_email = "";
    var values = [nc_email];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_getByNcEmail(?)', values);
}
exports.getChekEmail = async (email) => {
    //Checking data
    if (email === undefined) email = "";
    var values = [email];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_checkEmail(?)', values);
}
exports.post = async (nombre,email,password) => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL sp_create_user(?,?,?)', [nombre,email,password]);
}
exports.updatePassword = async (id_usuario,password) => {
    //Checking data
    if (password == undefined) password = "";
    var values = [id_usuario, password];

    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_userUpdatePassword(?,?)', values);
}

exports.patch = async (userId, nc_email, email, access, first_name, last_name, prefix, phone,
    cellphone_prefix, cellphone, address, city, department, bank_name, account_number, account_type_id, comission) => {
    //Checking data
    if (userId == undefined) userId = null;
    if (email == undefined) email = null;
    if (nc_email == undefined) nc_email = "";
    if (access == undefined) access = null;
    if (first_name == undefined) first_name = null;
    if (last_name == undefined) last_name = null;
    if (prefix == undefined) prefix = null;
    if (phone == undefined) phone = null;
    if (cellphone_prefix == undefined) cellphone_prefix = null;
    if (cellphone == undefined) cellphone = null;
    if (address == undefined) address = null;
    if (city == undefined) city = null;
    if (department == undefined) department = null;
    if (bank_name == undefined) bank_name = null;
    if (account_number == undefined) account_number = null;
    if (account_type_id == undefined) account_type_id = null;
    if (comission == undefined) comission = null;

    
    var values = [userId, nc_email,email, access, first_name, last_name, prefix, phone, cellphone_prefix, cellphone, address, city, department, bank_name, account_number, account_type_id, comission];
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_patch(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', values);
}
exports.delete = async (userId) => {
    var values = [userId];
    if (userId === undefined) userId = "";
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL strp_User_delete(?)', values);
}