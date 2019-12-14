const axios = require('axios');
const { bongoBotAPI: { host, port }, username, password } = require('../../config.json');

const bongoBotAPI = axios.create({
  baseURL: `http://${host}:${port}`,
  auth: {
    user: username,
    pass: password,
  },
});

module.exports = {
  bongoBotAPI,
};
