exports.hasType = function(type) {
  return function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    if(!req.user){
      return res.status(403).send(JSON.stringify({success:false,error:{code:107, message:"Error in authentification",details:null}}, null, 3));
    }
    if (!req.user.types.includes(type)) {
      return res.status(401).send(JSON.stringify({success:false,error:{code:105, message:"User is not authorized to perform this action",details:null}}, null, 3));
    }
    next();
  }
}