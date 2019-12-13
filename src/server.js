const express = require('express');
const bodyParser = require('body-parser');
const log4js = require('log4js');

const logger = log4js.getLogger();
const { basicAuth, authorizer, unauthResponse } = require('./middleware/basicAuth');
const { port } = require('../config.json');

const app = express();

app.use(basicAuth({
  authorizer,
  authorizeAsync: true,
  unauthorizedResponse: unauthResponse,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(port, () => {
  logger.log(`Express server listening on port ${port}`);
});

process.on('unhandledRejection', (reason, p) => {
  logger.error(JSON.stringify(`Unhandled Rejection at: Promise ${p} reason: ${reason}`));
});

process.on('uncaughtException', (err) => {
  logger.error(`${(new Date()).toUTCString()} uncaughtException: ${err.message}`);
  logger.error(err.stack);
});
