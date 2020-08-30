const guildMemberUpdate = require('./guildMemberUpdate');
const guildMemberRemove = require('./guildMemberRemove');
const raw = require('./raw');

const run = async (bot) => {
  await guildMemberUpdate(bot);
  await guildMemberRemove(bot);
  await raw(bot);
};

module.exports = run;
