// server/boot/session.js
module.exports = function(app) {
  var session = require('express-session');
  app.middleware('session', session({
    "saveUninitialized": true,
    "resave": true,
    "secret": "secret"
  }));
}
