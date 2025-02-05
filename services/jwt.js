var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('../config');

//Secret key
var TOKEN_SECRET = config.TOKEN_SECRET;

exports.createToken = function(user){
  
  
  //Handle payload
  var payload = {
      user_id:user.id_usuario,
      email: user.email,
      user_type_id:user.id_rol,
      first_name:user.nombre,
      iat: moment().unix(),
      exp: moment().add(1, 'year').unix()
  };

  //Handle user types
  if (payload.user_type_id===1) payload.types = ['Admin','User'];
  else if (payload.user_type_id===2) payload.types = ['User'];
  
  var token = jwt.encode(payload,TOKEN_SECRET);
  return { success:true, data:{ exp:payload.exp, token:token, user_id:user.id_usuario, username: user.nombre, user_type_id:user.id_rol } };
};

exports.createChangePasswordToken = function(userId){
  //Handle payload
  var payload = {
      id_user:userId,
      iat: moment().unix(),
      exp: moment().add(1, 'days').unix()
  };
  return jwt.encode(payload,TOKEN_SECRET);
};

exports.createEmailConfirmationToken = function(userId, email){
  //Handle payload
  var payload = {
      id_user:userId,
      email:email,
      iat: moment().unix(),
      exp: moment().add(1, 'days').unix()
  };
  return jwt.encode(payload,TOKEN_SECRET);
};

exports.ensureJWTAuth = function(req, res, next){
  res.setHeader('Content-Type', 'application/json');
  if(!req.headers.authorization){
    return res.status(403).send(JSON.stringify({success:false,error:{code:101, message:"Request is missing authorization header",details:null}}, null, 3));
  }
   //var token = req.headers.authorization.split(" ")[1];
  var token = req.headers.authorization.replace(/['"]+/g,'');
  try{
    var payload = jwt.decode(token,TOKEN_SECRET);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send(JSON.stringify({success:false,error:{code:102, message:"Expired token",details:null}}, null, 3));
    } else {
      req.user = payload;
      next();
    }
  } catch (err) {
    return res.status(403).send(JSON.stringify({success:false,error:{code:103, message:`${err}`.substr(7),details:null}}, null, 3));
  }
};

exports.reAuthentificateToken = function(payload){
  payload.iat= moment().unix();
  payload.exp= moment().add(1, 'hours').unix();
  var token = jwt.encode(payload,TOKEN_SECRET);
  return { success:true, data:{ exp:payload.exp, token:token, user_id:payload.id_user, user_type_id:payload.user_type_id, language_id:payload.language_id, gender_id:payload.gender_id  } };
};

exports.decodeChangePasswordToken = function(req, res, next){
  res.setHeader('Content-Type', 'application/json');
  if (!req.body.password_change_token){
    return res.status(403).send(JSON.stringify({success:false,error:{code:105, message:"Password change token is required",details:null}}, null, 3));
  }
  var token = req.body.password_change_token.replace(/['"]+/g,'');
  try{
    var payload = jwt.decode(token,TOKEN_SECRET);
    payload.password_change_token = token;
    if (payload.exp <= moment().unix()) {
      return res.status(401).send(JSON.stringify({success:false,error:{code:102, message:"Expired token",details:null}}, null, 3));
    }
  } catch (err) {
    return res.status(403).send(JSON.stringify({success:false,error:{code:103, message:`${err}`.substr(7),details:null}}, null, 3));
  }
  req.change = payload;
  next();
};

exports.decodeConfirmEmailToken = function(req, res, next){
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.body.email_confirmation_token){
    return res.status(403).send(JSON.stringify({success:false,error:{code:105, message:"Email confirmation token is required",details:null}}, null, 3));
  }
  var token = req.body.email_confirmation_token.replace(/['"]+/g,'');
  try{
    var payload = jwt.decode(token,TOKEN_SECRET);
    payload.email_confirmation_token = token;
    if (payload.exp <= moment().unix()) {
      return res.status(401).send(JSON.stringify({success:false,error:{code:102, message:"Expired token",details:null}}, null, 3));
    }
  } catch (err) {
    return res.status(403).send(JSON.stringify({success:false,error:{code:103, message:`${err}`.substr(7),details:null}}, null, 3));
  }
  req.confirm = payload;
  next();
};