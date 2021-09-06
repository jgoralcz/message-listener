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
    if (oldMember.roles && newMember.roles && oldMember.roles.size === newMember.roles.size) return undefined;

    // new members
    if (!oldMember.roles.get(superBongo) && newMember.roles.get(superBongo)) {
      updateSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
    }

    if (!oldMember.roles.get(bongoNeko) && newMember.roles.get(bongoNeko)) {
      updateGuildPatron(client, newMember, 'Bongo Neko').catch((error) => logger.error(error));
    }

    if (!oldMember.roles.get(smolNeko) && newMember.roles.get(smolNeko)) {
      updateGuildPatron(client, newMember, 'Smol Neko').catch((error) => logger.error(error));
    }

    // special
    if (!oldMember.roles.get(bongoDaddy) && newMember.roles.get(bongoDaddy)) {
      if (process.env.NODE_ENV === PROD) {
        oldMember.send('OwO I didn\'t expect anyone to be this nice! Thanks for being a Bongo Daddy patron!').catch((error) => logger.error(error));
      }
    }

    // removed role
    if (oldMember.roles.get(superBongo) && !newMember.roles.get(superBongo)) {
      resetSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
    }

    if (oldMember.roles.get(bongoNeko) && !newMember.roles.get(bongoNeko)) {
      resetGuildLeaver(client, newMember, 'Bongo Neko').catch((error) => logger.error(error));
    }

    if (oldMember.roles.get(smolNeko) && !newMember.roles.get(smolNeko)) {
      resetGuildLeaver(client, newMember, 'Smol Neko').catch((error) => logger.error(error));
    }

    return undefined;
  });
};

module.exports = run;
