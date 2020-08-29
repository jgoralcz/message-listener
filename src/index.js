require('./server.js');
const { Client, Intents } = require('discord.js');
const log4js = require('log4js');
const { basicAuth: loginToken, config } = require('./util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { token } = require(loginToken);
// eslint-disable-next-line import/no-dynamic-require
const { owner } = require(config);

const events = require('./events/index');

const logger = log4js.getLogger();

const myIntents = new Intents();
myIntents.add('GUILDS', 'GUILD_EMOJIS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES');

const client = new Client({
  ws: {
    intents: myIntents,
  },
});

client.on('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}.`);
  logger.info(await client.generateInvite());

  await client.user.setStatus('invisible');
  await events(client);
});

client.on('error', async (error) => {
  const ownerUser = await client.fetchUser(owner);
  logger.error(error);
  ownerUser.send(error).catch((err) => logger.error(err));
});

client.login(token).catch((error) => logger.error(error));

module.exports = client;
