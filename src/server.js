const app = require('./app');
const { port }  = require('../config.json');

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
