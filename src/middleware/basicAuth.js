const basicAuth = require('express-basic-auth');
const { username, password } = require('../../config.json');

const authorizer = (user, pass, cb) => {
  if (user === username && pass === password) {
    return cb(null, true);
  }
  return cb(null, false);
};

const unauthResponse = (req) => (req.auth
  ? (`{ "error": "Credentials ${req.auth.user}:${req.auth.password} rejected" }`)
  : '{ "error": "No credentials provided" }');

module.exports = {
  basicAuth,
  authorizer,
  unauthResponse,
};
