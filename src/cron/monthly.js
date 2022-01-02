const logger = require('log4js').getLogger();
const schedule = require('node-schedule');
const { addBankPointsPatronMonthly } = require('../services/user');

const job = schedule.scheduleJob('0 0 1 * ', () => {
  addBankPointsPatronMonthly.catch((error) => logger.error(error));
});
