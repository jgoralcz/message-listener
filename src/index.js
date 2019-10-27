const Discord = require('discord.js');
const client = new Discord.Client();
const { token } = require('../config.json');

const events = require('./events/index');

client.on('ready', async () => {
  // console.log(await client.generateInvite());
  await client.user.setStatus('invisible');
  console.log(`Logged in as ${client.user.tag}.`);

  await events(client);
  // require('./server.js');
});

client.login(token).catch(console.error);

module.exports = client;