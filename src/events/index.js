const guildMemberUpdate = require('./guildMemberUpdate');
const guildMemberRemove = require('./guildMemberRemove');
const interactionCreate = require('./interactionCreate');

const run = async (bot) => {
  guildMemberUpdate(bot);
  guildMemberRemove(bot);
  interactionCreate(bot);
};

module.exports = run;
