const guildMemberUpdate = require('./guildMemberUpdate');
const guildMemberRemove = require('./guildMemberRemove');
const raw = require('./raw');

const run = async (bot) => {
  guildMemberUpdate(bot);
  guildMemberRemove(bot);
  raw(bot);
};

module.exports = run;
