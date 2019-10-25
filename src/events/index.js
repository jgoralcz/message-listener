const guildMemberUpdate = require('./guildMemberUpdate');

const run = async (bot) => {
  await guildMemberUpdate(bot);
};

module.exports = run;
