const { RichEmbed } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { imageChannel } = require('../../../config.json');
const { reviewer } = require('../../util/constants/roles');
const { APPROVE, DENY, NSFW } = require('../../util/constants/emojis');

route.post('/', async (req, res) => {
  try {
    const channel = client.channels.get(imageChannel);
    const {
      name, series, body, imageURL, uploader, nsfw, id,
    } = req.body;

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${series} - ${(nsfw || 'sfw').toString().toUpperCase()}\n${body}`)
      .setTimestamp();

    if (!channel) return;

    const reactMessage = await channel.send(embed);

    const filter = (reaction, user) => (
      reaction.emoji.id === APPROVE
      || reaction.emoji.id === DENY
      || reaction.emoji.id === NSFW
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 60000000 });

    await reactMessage.react(APPROVE);
    await reactMessage.react(DENY);
    await reactMessage.react(NSFW);

    const collectorFunction = async (r) => {
      if (r == null || !r.emoji || !r.fetchUsers) return;

      await r.fetchUsers();
      const user = r.users.filter((u) => !u.bot).last();
      if (user == null) return;

      const member = await reactMessage.guild.fetchMember(user).catch(() => null);
      if (!member.roles.get(reviewer)) return;

      switch (r.emoji.id) {
        case APPROVE:
          try {
            await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: false, uploader, id }).catch((error) => logger.error(error));
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        case DENY:
          try {
            // await bongoBotAPI.delete(`/images/${id}`);
            await reactMessage.delete();
            logger.info(`Deleted ${name}, ${series}, ${imageURL}`);
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        case NSFW:
          try {
            await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: true, uploader, id }).catch((error) => logger.error(error));
            // await bongoBotAPI.patch(`/images/${id}/nsfw`, { nsfw: true });
            const nsfwEmbed = new RichEmbed()
              .setTitle(name)
              .setImage(imageURL)
              .setURL(imageURL)
              .setDescription(`${series} - NSFW\n${body}`)
              .setTimestamp();
            await reactMessage.edit(nsfwEmbed);
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
      if (!reactMessage || reactMessage.deleted) return;

      await reactMessage.clearReactions();
    });

    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
});


module.exports = route;
