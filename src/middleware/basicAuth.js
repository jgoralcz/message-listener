const basicAuth = require('express-basic-auth');
const { basicAuth: auth } = require('../util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { username, password } = require(auth);

const authorizer = (user, pass, cb) => cb(null, user === username && pass === password);

const unauthResponse = (req) => (req.auth
  ? JSON.stringify({ error: `Credentials ${req.auth.user}:${req.auth.password} rejected` })
  : JSON.stringify({ error: 'No credentials provided' })
);

module.exports = {
  basicAuth,
  authorizer,
  unauthResponse,
};
