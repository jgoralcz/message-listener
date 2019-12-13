const axios = require('axios');
const { bongoBotAPI: { host, port } } = require('../../config.json');

const bongoBotAPI = axios.create({
  baseURL: `http://${host}:${port}`,
});

module.exports = {

};
