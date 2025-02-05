'use strict';
var winston = require('winston');
const {
  format
} = require('winston');
var fs = require('fs');
var config = require('../config');

var ENVIRONMENT = config.ENVIRONMENT;
var WINSTON_REMOTE_PORT = config.WINSTON_REMOTE_PORT;
var WINSTON_REMOTE_HOST = config.WINSTON_REMOTE_HOST;

const logDir = 'logs';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleString();
const tsFormat2 = () => (new Date()).toLocaleTimeString();

if (ENVIRONMENT === "development") {
  var transports = [
    new(winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true
    }),
    new(winston.transports.File)({
      filename: './logs/api.log'
    })
  ]
} else {
  var transports = [
    new(winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true
    }),
    new(winston.transports.File)({
      filename: './logs/api.log'
    })
  ]
}


exports.logger = winston.createLogger({
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: transports
});