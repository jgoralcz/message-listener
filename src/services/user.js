const logger = require('log4js').getLogger();
const { bongoBotAPI } = require('./bongo');

const addBankPoints = async (userID, points) => {
  const { status, data } = await bongoBotAPI.patch(`/users/${userID}/points`, { points });

  if (status !== 200 || !data || data.points == null) {
    logger.error(`User ${userID} had a problem when adding bank points: ${points}.`);
    return 0;
  }

  return data.points;
};

module.exports = {
  addBankPoints,
};
