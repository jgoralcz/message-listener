const logger = require('log4js').getLogger();

const {
  superBongo,
  bongoNeko,
  smolNeko,
  bongoDaddy,
} = require('../util/constants/roles');

const {
  resetGuildLeaver,
  resetSuperBongo,
  updateGuildPatron,
  updateSuperBongo,
} = require('../lib');

const { PROD } = require('../util/constants/environments');

const run = (client) => {
  // check for role updates.
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // they have the same roles as before
    if (oldMember.roles.cache && newMember.roles.cache && oldMember.roles.cache.size === newMember.roles.cache.size) return undefined;

    // new members
    if (!oldMember.roles.cache.get(superBongo) && newMember.roles.cache.get(superBongo)) {
      updateSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
    }

    if (!oldMember.roles.cache.get(bongoNeko) && newMember.roles.cache.get(bongoNeko)) {
      updateGuildPatron(client, newMember, 'Bongo Neko').catch((error) => logger.error(error));
    }

    if (!oldMember.roles.cache.get(smolNeko) && newMember.roles.cache.get(smolNeko)) {
      updateGuildPatron(client, newMember, 'Smol Neko').catch((error) => logger.error(error));
    }

    // special
    if (!oldMember.roles.cache.get(bongoDaddy) && newMember.roles.cache.get(bongoDaddy)) {
      if (process.env.NODE_ENV === PROD) {
        oldMember.send('OwO I didn\'t expect anyone to be this nice! Thanks for being a Bongo Daddy patron!').catch((error) => logger.error(error));
      }
    }

    // removed role
    if (oldMember.roles.cache.get(superBongo) && !newMember.roles.cache.get(superBongo)) {
      resetSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
    }

    if (oldMember.roles.cache.get(bongoNeko) && !newMember.roles.cache.get(bongoNeko)) {
      resetGuildLeaver(client, newMember, 'Bongo Neko').catch((error) => logger.error(error));
    }

    if (oldMember.roles.cache.get(smolNeko) && !newMember.roles.cache.get(smolNeko)) {
      resetGuildLeaver(client, newMember, 'Smol Neko').catch((error) => logger.error(error));
    }

    return undefined;
  });
};

module.exports = run;
