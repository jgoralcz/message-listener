const axios = require('axios');

const { basicAuth, config } = require('../util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { api } = require(config);
// eslint-disable-next-line import/no-dynamic-require
const { username, password } = require(basicAuth);

const bongoBotAPI = axios.create({
  baseURL: api,
  auth: { username, password },
  headers: { 'Content-type': 'application/json' },
});

module.exports = {
  bongoBotAPI,
};
