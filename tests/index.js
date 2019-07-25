const index = require('../src/index.js');
const rp = require('request-promise');
const { username, password, port} = require('../config.json');

setTimeout(async () => {
  await rp({
    uri: `http://localhost:${port}/vote/`,
    method: 'POST',
    body: JSON.stringify({userID: '304478893010583552', streak: 50, points: 400}),
    auth: {
      'user': username,
      'pass': password
    },
    encoding: null,
    headers: {
      'Content-type': 'application/json'
    },
  });

}, 5000);


