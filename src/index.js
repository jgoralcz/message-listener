const Discord = require('discord.js');
const log4js = require('log4js');

const { token } = require('../config.json');
const events = require('./events/index');

const logger = log4js.getLogger();

const client = new Discord.Client();

client.on('ready', async () => {
  logger.log(`Logged in as ${client.user.tag}.`);
  logger.log(await client.generateInvite());

  await client.user.setStatus('invisible');
  await events(client);

  require('./server.js');
});

client.login(token).catch((error) => logger.error(error));

module.exports = client;
