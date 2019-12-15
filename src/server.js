const express = require('express');
const bodyparser = require('body-parser');
const log4js = require('log4js');

const router = require('./routes/routes');

const { basicAuth, authorizer, unauthResponse } = require('./middleware/basicAuth');
const { errorHandler } = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logger');

const logger = log4js.getLogger();
const { LOCAL, PROD, TEST } = require('./util/constants/environments');
const { port } = require('../config.json');

const env = process.env.NODE_ENV || LOCAL;

logger.level = 'info';
const server = express();

server.use(basicAuth({
  authorizer,
  authorizeAsync: true,
  unauthorizedResponse: unauthResponse,
}));

server.use(bodyparser.urlencoded({ extended: true }));
server.use(bodyparser.json());
server.use(httpLogger());

server.use('/', router, errorHandler);

// if (env.toUpperCase() === PROD || env.toUpperCase() === TEST) {
// const certificate = { key: fs.readFileSync(serverKey), cert: fs.readFileSync(serverCert) };
// https.createServer(certificate, server).listen(port, () => logger.info(`${env.toUpperCase()} https server started on ${port}.`))
// } else {
server.listen(port, () => logger.info(`${env.toUpperCase()} server started on ${port}.`));
// }

process.on('unhandledRejection', (reason, p) => {
  logger.error(JSON.stringify(`Unhandled Rejection at: Promise ${p} reason: ${reason}`));
});

process.on('uncaughtException', (err) => {
  logger.error(`${(new Date()).toUTCString()} uncaughtException: ${err.message}`);
  logger.error(err.stack);
});
