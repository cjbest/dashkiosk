'use strict';

var bus = require('./bus.js');
var http = require("http");
var https = require('https');
var config = require('./config');
var logger = require('./logger');

var timeout = null;
var schedulePoll = null;

function doPoll() {
  logger.debug('doing poll');
  http.get(config.get('poll_url'), function(res) {
      //logger.info("got poll result", res);

      if (res.statusCode === 204) {
        logger.debug("polled, nothing new");
        schedulePoll();
        return;
      }
      else if (res.statusCode !== 200) {
        logger.warn("error polling, status", res.statusCode);
        schedulePoll();
        return;
      }
      var body = '';

      res.on('data', function(chunk) {
          body += chunk;
      });

      res.on('end', function() {
          var broadcast = JSON.parse(body);
          logger.debug('got broadcast', broadcast);
          bus.publish('broadcast', broadcast);
          schedulePoll();
      });

  }).on('error', function(e) {
        logger.error("Got error while polling", e);
        schedulePoll();
  });
}

schedulePoll = function() {
  timeout = setTimeout(doPoll, 500);
};

module.exports = {
  start: schedulePoll
};
