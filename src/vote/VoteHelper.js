const client = require('../index');
const { voteChannel } = require('../../config.json');
const channel = client.channels.get(voteChannel);

/**
 * post vote to discord channel
 * @param req the request object with our values.
 * @param res the response object with our values.
 * @returns {Promise<void>}
 */
const postVote = async (req, res) => {
  try {
    const { userID, streak, points } = req.body;
    const user = await client.fetchUser(userID);
    const userName = user.tag;

    await channel.send(`${userName}(${userID}) has received ${points} points, reset their rolls, and is on a ${streak} day voting streak.`, {
      split: true,
      code: "js",
    });
    res.send(200);
  }
  catch(error) {
    console.error(error);
    res.send(500);
  }
};


module.exports = {
  postVote,
};
