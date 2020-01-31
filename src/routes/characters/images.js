const { RichEmbed } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { imageChannels: { pending, accepted, denied } } = require('../../../config.json');
const { reviewer } = require('../../util/constants/roles');
const { APPROVE, DENY, NSFW } = require('../../util/constants/emojis');

route.post('/', async (req, res) => {
  try {
    const channelPending = client.channels.get(pending);
    const channelAccept = client.channels.get(accepted);
    const channelDenied = client.channels.get(denied);

    const {
      name, series, body, imageURL, uploader, nsfw, id,
    } = req.body;

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
      .setTimestamp();

    if (!channelPending) return;

    const reactMessage = await channelPending.send('<:success:473906375064420362> = SFW <:blacklist:473914756827316236> = NSFW <:failure:473906403019456522> = DELETE', embed);

    const filter = (reaction, user) => (
      reaction.emoji.id === APPROVE
      || reaction.emoji.id === DENY
      || reaction.emoji.id === NSFW
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 60000000 });

    await reactMessage.react(APPROVE);
    await reactMessage.react(NSFW);
    await reactMessage.react(DENY);

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
            const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: false, uploader, id }).catch((error) => logger.error(error));

            const sfwEmbed = new RichEmbed()
              .setTitle(name)
              .setImage(data.url)
              .setURL(data.url)
              .setDescription(`${series} - SFW\n${body}`)
              .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
              .setTimestamp();

            await channelAccept.send({ embed: sfwEmbed });
            await reactMessage.delete();

            const uploadUser = await client.fetchUser(uploader);
            uploadUser.send(`\`✅\` | Your SFW (safe for work) image for **${name}** from **${series}** has been uploaded to: ${data.url}`);
          } catch (error) {
            logger.error(error);
            await reactMessage.edit('`❌` | An error occurred with this image...');
          }
          collector.stop();
          break;

        case DENY:
          try {
            // await bongoBotAPI.delete(`/images/${id}`);
            logger.info(`Deleted ${name}, ${series}, ${imageURL}`);

            await channelDenied.send({ embed });
            await reactMessage.delete();

            const uploadUser = await client.fetchUser(uploader);
            uploadUser.send(`\`❌\` | ${imageURL} for **${name}** from **${series}** has been denied. Try to upload high quality and relevant images. Thank you!`);
          } catch (error) {
            logger.error(error);
            await reactMessage.edit('`❌` | An error occurred with this image...');
          }
          collector.stop();
          break;

        case NSFW:
          try {
            const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: true, uploader, id }).catch((error) => logger.error(error));

            const nsfwEmbed = new RichEmbed()
              .setTitle(name)
              .setImage(data.url)
              .setURL(data.url)
              .setDescription(`${series} - NSFW\n${body}`)
              .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
              .setTimestamp();

            await channelAccept.send({ embed: nsfwEmbed });
            await reactMessage.delete();

            const uploadUser = await client.fetchUser(uploader);
            uploadUser.send(`\`✅\` | Your NSFW (Not Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}`);
          } catch (error) {
            logger.error(error);
            await reactMessage.edit('`❌` | An error occurred with this image...');
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
