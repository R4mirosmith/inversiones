var db = require('./db/db');
var app = require('./server/server');
var http = require('http');
var publicIp = require('public-ip');
var nodeCleanup = require('node-cleanup');
var log = require('./services/apilogger');
var config = require('./config');

//Get port from environment and store in Express.
var APP_PORT = config.APP_PORT ;

//Get IP
publicIp.v4().then(ip => {
  global.ip = ip;
  // Connect to MySQL on start
  db.connect((err) => {
    if (err) {
      log.logger.error(`{"message":"Cannot connect to MySQL Server from API Server at ${ip}:${APP_PORT}"}`);
      process.exit();
    } else {
      global.server = app.listen(APP_PORT, () => {
        log.logger.info(`{"message":"API Server listening at ${ip}:${APP_PORT}"}`);
      });
    }
  });
});

//Cleanup on exit
nodeCleanup(function (exitCode, signal) {
    if (signal) {
      global.server.close(function () {
        db.end(function (err,EndResult) {
          if (err) throw err;
          log.logger.info(`{"message":"Cleanup succesfull, exiting API Server at ${global.ip}:${APP_PORT}"}`);
          process.kill(process.pid, signal);
        });
      });
      nodeCleanup.uninstall();
      return false;
    }
});




