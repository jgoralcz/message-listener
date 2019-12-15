const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../index');
const { voteChannel } = require('../../config.json');

route.post('/', async (req, res) => {
  const channel = client.channels.get(voteChannel);
  const { userID, streak, points } = req.body;

  if (!userID || !streak || !points) return res.status(400).send({ error: 'Invalid Input', message: 'Body missing userID, streak, and points' });

  const user = await client.fetchUser(userID);
  const userName = user.tag;

  await channel.send(`${userName}(${userID}) has received ${points} points, reset their rolls, and is on a ${streak} day voting streak.`, {
    split: true,
    code: 'js',
  });
  return res.sendStatus(200);
});


module.exports = route;
