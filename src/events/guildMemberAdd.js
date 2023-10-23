const logger = require('log4js').getLogger();
const { addBankPoints } = require('../services/user');

const {
  superBongo,
  bongoNeko,
  smolNeko,
  bongoDaddy,
} = require('../util/constants/roles');

const {
  updateGuildPatron,
  updateSuperBongo,
} = require('../lib');

const { PROD } = require('../util/constants/environments');

const run = async (client) => {
  // check for role updates.
  client.on('guildMemberAdd', async (newMember) => {
    // new members
    if (newMember.roles.cache.get(superBongo)) {
      const alreadySent = client.usersAdded.has(newMember.id);
      if (alreadySent) {
        updateSuperBongo(client, newMember, 'Super Bongo', alreadySent).catch((error) => logger.error(error));
      } else {
        await addBankPoints(newMember.id, 1000000);
        client.usersAdded.add(newMember.id);

        updateSuperBongo(client, newMember, 'Super Bongo').catch((error) => logger.error(error));
      }
    }

    if (newMember.roles.cache.get(bongoNeko)) {
      updateGuildPatron(client, newMember, 'Bongo Neko').catch((error) => logger.error(error));
    }

    if (newMember.roles.cache.get(smolNeko)) {
      updateGuildPatron(client, newMember, 'Smol Neko').catch((error) => logger.error(error));
    }

    // special
    if (newMember.roles.cache.get(bongoDaddy)) {
      if (process.env.NODE_ENV === PROD) {
        newMember.send('OwO I didn\'t expect anyone to be this nice! Thanks for being a Bongo Daddy patron!').catch((error) => logger.error(error));
      }
    }

    return undefined;
  });
};

module.exports = run;
