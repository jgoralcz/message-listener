const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../index');
const { voteChannel } = require('../../config.json');

const postVote = async (req, res) => {
  try {
    const channel = client.channels.get(voteChannel);
    const { userID, streak, points } = req.body;

    const user = await client.fetchUser(userID);
    const userName = user.tag;

    await channel.send(`${userName}(${userID}) has received ${points} points, reset their rolls, and is on a ${streak} day voting streak.`, {
      split: true,
      code: 'js',
    });
    return res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};


module.exports = {
  postVote,
};
