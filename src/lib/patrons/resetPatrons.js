const log4js = require('log4js');

const logger = log4js.getLogger();

const { owner } = require('../../../config');
const { bongoBotAPI } = require('../../services/bongo');
const client = require('../../index');

const { getPatronIDByName } = require('./patronByID');

const thanksGoodbye = (role) => `Thanks for being a ${role} patron! Every bit of support helps keep me alive and allows me to create new things for everyone! Unfortunately, you no longer have your perks.\n\n This process is automatic. If you believe there is a mistake please ask in the official support server https://discord.gg/dfajqcZ.`;

const resetSuperBongo = async (leftMember, patronType) => {
  try {
    const patronID = await getPatronIDByName(patronType);

    await bongoBotAPI.patch(`/patrons/users/${leftMember.id}/reset`, { patronID });

    logger.info(patronType, leftMember.id, patronID, false);
  } catch (error) {
    logger.error(error);
    logger.error(`Could not remove ${leftMember.id} - ${patronType}`);

    const ownerUser = await client.fetchUser(owner);
    ownerUser.send(`Could not remove ${leftMember.id} - ${patronType}`);
  }
  leftMember.send(thanksGoodbye(patronType)).catch((error) => logger.error(error));
};

const resetGuildLeaver = async (leftMember, patronType) => {
  try {
    const patronID = await getPatronIDByName(patronType);
    await bongoBotAPI.patch(`/patrons/users/${leftMember.id}/guilds/reset`, { patronID });

    logger.info(patronType, leftMember.id, patronID, false);
  } catch (error) {
    logger.error(error);
    logger.error(`Could not remove ${leftMember.id} - ${patronType}`);

    const ownerUser = await client.fetchUser(owner);
    ownerUser.send(`Could not remove ${leftMember.id} - ${patronType}`);
  }

  leftMember.send(thanksGoodbye(patronType)).catch((error) => logger.error(error));
};

module.exports = {
  resetSuperBongo,
  resetGuildLeaver,
};
