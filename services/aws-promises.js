
var config = require('../config');

const ENVIRONMENT = config.ENVIRONMENT;

var keys;
if (ENVIRONMENT === 'production') {
  keys = {
    signatureVersion: 'v4',
    region: config.S3_REGION
  };
} else {
  keys = {
    accessKeyId: config.ACCESS_KEY_ID,
    secretAccessKey: config.SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    region: config.S3_REGION
  }; 
}



exports.getSignedUrlPromise = async (params) => {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', params, (err, url) => {
      err ? reject(err) : resolve(url);
    });
  });
}

exports.getSignedUrlPromiseDownload = async (params) => {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, (err, url) => {
      err ? reject(err) : resolve(url);
    });
  });
}