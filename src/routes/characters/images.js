const { RichEmbed } = require('discord.js');
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { imageChannel } = require('../../../config.json');

const postImage = async (req, res) => {
  try {
    const channel = client.channels.get(imageChannel);
    const {
      title, thumbnail, imageURL, body, id,
    } = req.body;

    const embed = new RichEmbed()
      .setTitle(title)
      .setThumbnail(thumbnail)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(body)
      .setTimestamp();

    if (!channel) return;

    const reactMessage = await channel.send(embed);

    const filter = (reaction, user) => (
      reaction.emoji.id === '473906375064420362'
      || reaction.emoji.id === '473906403019456522'
      || reaction.emoji.id === '473914756827316236'
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 60000000 });

    await reactMessage.react('473906375064420362');
    await reactMessage.react('473906403019456522');
    await reactMessage.react('473914756827316236');

    const collectorFunction = async (r) => {
      if (r == null || !r.emoji || !r.fetchUsers) return;

      await r.fetchUsers();
      const user = r.users.filter((u) => !u.bot).last();
      if (user == null) return;

      switch (r.emoji.id) {
        // ok
        case '473906375064420362':
          collector.stop();
          break;

        // delete
        case '473906403019456522':
          try {
            await bongoBotAPI.delete();
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        // nsfw
        case '473914756827316236':
          try {
            await bongoBotAPI.patch();
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        default:
          break;
      }
    };

    collector.on('collect', collectorFunction);
    collector.on('end', async () => {
      if (reactMessage.deleted) return;

      await reactMessage.clearReactions();
    });

    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
};


module.exports = {
  postImage,
};
