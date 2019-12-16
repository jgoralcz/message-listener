require('./server.js');
const { Client } = require('discord.js');
const log4js = require('log4js');

const { token } = require('../config.json');
const events = require('./events/index');

const logger = log4js.getLogger();

const client = new Client();

client.on('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}.`);
  logger.info(await client.generateInvite());

  await client.user.setStatus('invisible');
  await events(client);
<<<<<<< HEAD
=======
  require('./server.js');
>>>>>>> 2645dcc3037d509d2155d7907d5488cbeb20a5d6
});

client.login(token).catch((error) => logger.error(error));

module.exports = client;
