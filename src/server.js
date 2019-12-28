const fs = require('fs');
const express = require('express');
const bodyparser = require('body-parser');
const log4js = require('log4js');
const https = require('https');
const hsts = require('hsts');

const router = require('./routes/routes');

const { basicAuth, authorizer, unauthResponse } = require('./middleware/basicAuth');
const { errorHandler } = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logger');

const { serverCert, serverKey } = require('./util/constants/paths');
const { LOCAL, PROD, TEST } = require('./util/constants/environments');

const logger = log4js.getLogger();

const port = 8443;

const env = process.env.NODE_ENV || LOCAL;

logger.level = 'info';
const server = express();

server.use(basicAuth({
  authorizer,
  authorizeAsync: true,
  unauthorizedResponse: unauthResponse,
}));

server.use(hsts({ maxAge: 31536000 }));
server.use(bodyparser.urlencoded({ extended: true }));
server.use(bodyparser.json());
server.use(httpLogger());

server.use('/', router, errorHandler);

if (env.toUpperCase() === PROD || env.toUpperCase() === TEST) {
  const certificate = { key: fs.readFileSync(serverKey), cert: fs.readFileSync(serverCert) };
  https.createServer(certificate, server).listen(port, () => logger.info(`${env.toUpperCase()} https server started on ${port}.`))
} else {
  server.listen(port, () => logger.info(`${env.toUpperCase()} server started on ${port}.`));
}
