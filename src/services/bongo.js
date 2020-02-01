const axios = require('axios');
const { bongoBotAPI: api, username, password } = require('../../config.json');

const bongoBotAPI = axios.create({
  baseURL: api,
  auth: { username, password },
  headers: { 'Content-type': 'application/json' }
});

module.exports = {
  bongoBotAPI,
};
