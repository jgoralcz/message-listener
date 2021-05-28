const route = require('express-promise-router')();

const client = require('../index');
const { config } = require('../util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { voteChannel } = require(config);

route.post('/', async (req, res) => {
  const channel = client.channels.get(voteChannel);
  const {
    userID,
    streak,
    points,
    isPatron,
  } = req.body;

  if (!userID || !streak || !points) return res.status(400).send({ error: 'Invalid Input', message: 'Body missing userID, streak, and points' });

  const user = await client.fetchUser(userID);

  await channel.send(`${user.tag} ${isPatron ? '(is a patron) ' : ''}has received ${points} points, stored +1 roll reset, and is on a ${streak} day voting streak.`, {
    split: true,
    code: 'js',
  });
  return res.status(200).send();
});

module.exports = route;
