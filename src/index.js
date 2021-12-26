require('./server.js');
const { Client, Intents, Permissions } = require('discord.js');
const logger = require('log4js').getLogger();
const { basicAuth: loginToken, config } = require('./util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { token } = require(loginToken);
// eslint-disable-next-line import/no-dynamic-require
const { owner } = require(config);

const events = require('./events/index');

const myIntents = new Intents();
myIntents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  Intents.FLAGS.GUILD_VOICE_STATES,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.DIRECT_MESSAGES,
  Intents.FLAGS.GUILD_WEBHOOKS,
);
const client = new Client({
  intents: myIntents,
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'help') {
    await interaction.reply('I don\'t have any commands :^)');
  }
});

client.once('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}.`);

  client.application.commands.create({
    name: 'help',
    description: 'I don\t have any commands :^)',
  });

  const link = client.generateInvite({
    permissions: [
      Permissions.FLAGS.ADMINISTRATOR, // lazy
    ],
    scopes: ['bot'],
  });
  logger.info(link);

  client.user.setStatus('invisible');
  await events(client);
});

client.on('error', async (error) => {
  const ownerUser = await client.users.fetch(owner);
  logger.error(error);
  ownerUser.send(error).catch((err) => logger.error(err));
});

client.login(token).catch((error) => logger.error(error));

process.on('unhandledRejection', (reason, p) => {
  logger.error(reason.stack);
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error(`${(new Date()).toUTCString()} uncaughtException: `, err.message);
  logger.error(err.stack);
});

module.exports = client;
