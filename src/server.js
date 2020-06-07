const express = require('express');
const bodyparser = require('body-parser');
const log4js = require('log4js');

const router = require('./routes/routes');

const { basicAuth, authorizer, unauthResponse } = require('./middleware/basicAuth');
const { errorHandler } = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logger');

const { LOCAL } = require('./util/constants/environments');

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

server.use(bodyparser.urlencoded({ extended: true }));
server.use(bodyparser.json());
server.use(httpLogger());

server.use('/', router, errorHandler);

server.listen(port, () => logger.info(`${env.toUpperCase()} server started on ${port}.`));
