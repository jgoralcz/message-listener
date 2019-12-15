const axios = require('axios');
const { bongoBotAPI: { host, port }, username, password } = require('../../config.json');

const bongoBotAPI = axios.create({
  baseURL: `http://${host}:${port}`,
  auth: { username, password },
  headers: { 'Content-type': 'application/json' },
});

module.exports = {
  bongoBotAPI,
};
