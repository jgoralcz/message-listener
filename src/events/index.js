const guildMemberUpdate = require('./guildMemberUpdate');
const guildMemberRemove = require('./guildMemberRemove');

const run = async (bot) => {
  await guildMemberUpdate(bot);
  await guildMemberRemove(bot);
};

module.exports = run;
