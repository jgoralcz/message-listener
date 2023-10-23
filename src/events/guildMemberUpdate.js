const logger = require('log4js').getLogger();
const { addBankPoints } = require('../services/user');

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

const run = async (client) => {
  const creator = await client.users.fetch('304478893010583552').catch((error) => logger.error(error));
  // check for role updates.
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // they have the same roles as before
    // eslint-disable-next-line max-len
    if (oldMember.roles.cache && newMember.roles.cache && oldMember.roles.cache.size === newMember.roles.cache.size) {
      logger.info(newMember.roles);
      return undefined;
    }

    // new members
    if (!oldMember.roles.cache.get(superBongo) && newMember.roles.cache.get(superBongo)) {
      const alreadySent = client.usersAdded.has(newMember.id);
      if (alreadySent) {
        updateSuperBongo(client, newMember, 'Super Bongo', alreadySent).catch((error) => logger.error(error));
      } else {
        await addBankPoints(newMember.id, 1000000);
        client.usersAdded.add(newMember.id);

        updateSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
      }
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
      logger.info(`${newMember} wanted to remove`);
      creator.send(`member removed super bongo role: ${newMember}`).catch((error) => logger.error(error));
      // resetSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
    }

    if (oldMember.roles.cache.get(bongoNeko) && !newMember.roles.cache.get(bongoNeko)) {
      logger.info(`${newMember} wanted to remove`);
      creator.send(`member removed bongo neko role: ${newMember}`).catch((error) => logger.error(error));
      // resetGuildLeaver(client, newMember, 'Bongo Neko').catch((error) => logger.error(error));
    }

    if (oldMember.roles.cache.get(smolNeko) && !newMember.roles.cache.get(smolNeko)) {
      logger.info(`${newMember} wanted to remove`);
      creator.send(`member removed smole neko role: ${newMember}`).catch((error) => logger.error(error));
      // resetGuildLeaver(client, newMember, 'Smol Neko').catch((error) => logger.error(error));
    }

    return undefined;
  });
};

module.exports = run;
