const logger = require('log4js').getLogger();
const {
  superBongo,
  bongoNeko,
  smolNeko,
} = require('../util/constants/roles');

const { config } = require('../util/constants/paths');

const { resetGuildLeaver, resetSuperBongo } = require('../lib');

const run = async (client) => {
  const creator = await client.users.fetch(config.owner);
  client.on('guildMemberRemove', async (leftMember) => {
    if (leftMember.roles.cache.get(superBongo)) {
      creator.send(`member left with super bongo: ${leftMember}`).catch((error) => logger.error(error));
      return resetSuperBongo(client, leftMember, 'Super Bongo');
    }

    if (leftMember.roles.cache.get(bongoNeko)) {
      creator.send(`member left with bongo neko: ${leftMember}`).catch((error) => logger.error(error));
      return resetGuildLeaver(client, leftMember, 'Bongo Neko');
    }

    if (leftMember.roles.cache.get(smolNeko)) {
      creator.send(`member left with smol neko: ${leftMember}`).catch((error) => logger.error(error));
      return resetGuildLeaver(client, leftMember, 'Smol Neko');
    }

    return undefined;
  });
};

module.exports = run;
