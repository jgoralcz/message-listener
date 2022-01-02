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

const addBankPointsPatronMonthly = async () => {
  const { status, data } = await bongoBotAPI.patch('/patrons/points');

  if (status !== 200 || !data || data.points == null) {
    logger.error('=had a problem when adding patron points');
    return false;
  }

  return true;
};

module.exports = {
  addBankPoints,
  addBankPointsPatronMonthly,
};
