const { RichEmbed, Attachment } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const { imageIdentifier } = require('../../util/constants/ImageIdentifier');
const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { config } = require('../../util/constants/paths');
const { reviewer } = require('../../util/constants/roles');
const { OTHER_IMAGES } = require('../../util/constants/channels');
const {
  APPROVE,
  KEEP_SFW_IMAGE_NOT_CROPPED,
  DENY,
  NSFW,
  KEEP_NSFW_IMAGE_NOT_CROPPED,
} = require('../../util/constants/emojis');

// eslint-disable-next-line import/no-dynamic-require
const { imageChannels: { pending, accepted, denied } } = require(config);

const logger = log4js.getLogger();

const croppedDiscordImageOther = async (bot, id, buffer, imageURLClean) => {
  const channel = bot.channels.get(OTHER_IMAGES);
  if (!channel || !channel.send) {
    logger.error(`COULD NOT FIND CHANNEL ${OTHER_IMAGES}`);
    return;
  }
  const myMessage = await channel.send(new Attachment(Buffer.from(buffer), imageURLClean));
  if (myMessage && myMessage.attachments && myMessage.attachments.first
    && myMessage.attachments.first() && myMessage.attachments.first().proxyURL) {
    const uri = myMessage.attachments.first().proxyURL;
    await bongoBotAPI.patch(`/images/${id}/clean-discord`, { uri }).catch((error) => logger.error(error));
  }
};

route.post('/', async (req, res) => {
  try {
    const channelPending = client.channels.get(pending);
    const channelAccept = client.channels.get(accepted);
    const channelDenied = client.channels.get(denied);

    const {
      name, series, body, imageURL, uploader, nsfw, id,
    } = req.body;

    let buffer = '';
    try {
      const { status, data } = await bongoBotAPI.post('/mims/crop', { imageURL, width: 300, height: 467 }, { responseType: 'arraybuffer' });
      if (data && status === 200) {
        buffer = data;
      }
    } catch (error) {
      logger.error(error);
    }

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .attachFile(new Attachment(Buffer.from(buffer), `cropped.${imageIdentifier(buffer) || 'gif'}`))
      .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
      .setTimestamp();

    if (!channelPending) return;
    const reactMessage = await channelPending.send('<:success:473906375064420362> = SFW AND GOOD CROP | <:spray:570827763792085005> = SFW, BUT BAD CROP | <:blacklist:473914756827316236> = NSFW AND GOOD CROP | <:VeggieSad:588560051204259846> = NSFW, BUT BAD CROP | <:failure:473906403019456522> = DELETE\n\n**CROPPED IMAGE**: ', { embed });

    const filter = (reaction, user) => (
      reaction.emoji.id === APPROVE
      || reaction.emoji.id === DENY
      || reaction.emoji.id === NSFW
      || reaction.emoji.id === KEEP_SFW_IMAGE_NOT_CROPPED
      || reaction.emoji.id === KEEP_NSFW_IMAGE_NOT_CROPPED
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 8.64e+7 });

    await reactMessage.react(APPROVE);
    await reactMessage.react(KEEP_SFW_IMAGE_NOT_CROPPED);
    await reactMessage.react(NSFW);
    await reactMessage.react(KEEP_NSFW_IMAGE_NOT_CROPPED);
    await reactMessage.react(DENY);

    const collectorFunction = async (r) => {
      if (r == null || !r.emoji || !r.fetchUsers) return;

      await r.fetchUsers();
      const user = r.users.filter((u) => !u.bot).last();
      if (user == null) return;

      const member = await reactMessage.guild.fetchMember(user).catch(() => null);
      if (!member.roles.get(reviewer)) return;

      if (r.emoji.id === APPROVE) {
        try {
          const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: false, uploader, id, crop: true });

          const sfwEmbed = new RichEmbed()
            .setTitle(name)
            .setImage(data.url)
            .setURL(data.url)
            .setDescription(`${series} - SFW\n${body}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();

          if (data.urlCropped) {
            sfwEmbed.attachFile(data.urlCropped);
          }

          await channelAccept.send(data.urlCropped || '**Could not crop image**', { embed: sfwEmbed });
          await reactMessage.delete();

          await croppedDiscordImageOther(client, id, buffer, data.urlCropped).catch((error) => logger.error(error));

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`✅\` | Your SFW (safe for work) image for **${name}** from **${series}** has been uploaded to: ${data.url}`);
        } catch (error) {
          logger.error(error);
          await reactMessage.edit('`❌` | An error occurred with this image...');
        }
        collector.stop();
        return;
      }

      if (r.emoji.id === KEEP_SFW_IMAGE_NOT_CROPPED) {
        try {
          const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: false, uploader, id, crop: false });

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
        return;
      }

      if (r.emoji.id === DENY) {
        try {
          // await bongoBotAPI.delete(`/images/${id}`);
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          const embedDenied = new RichEmbed()
            .setTitle(name)
            .setImage(imageURL)
            .setURL(imageURL)
            .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();

          await channelDenied.send(embedDenied);
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | ${imageURL} for **${name}** from **${series}** has been denied. Try to upload high quality and relevant images. Thank you!`);
        } catch (error) {
          logger.error(error);
          await reactMessage.edit('`❌` | An error occurred with this image...');
        }
        collector.stop();
        return;
      }

      if (r.emoji.id === NSFW) {
        try {
          const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: true, uploader, id, crop: true });

          const nsfwEmbed = new RichEmbed()
            .setTitle(name)
            .setImage(data.url)
            .setURL(data.url)
            .setDescription(`${series} - NSFW\n${body}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();

          if (data.urlCropped) {
            nsfwEmbed.attachFile(data.urlCropped);
          }

          await croppedDiscordImageOther(client, id, buffer, data.urlCropped).catch((error) => logger.error(error));

          await channelAccept.send(data.urlCropped || '**Could not crop image**', { embed: nsfwEmbed });
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`✅\` | Your NSFW (Not Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}`);
        } catch (error) {
          logger.error(error);
          await reactMessage.edit('`❌` | An error occurred with this image...');
        }
        collector.stop();
        return;
      }

      if (r.emoji.id === KEEP_NSFW_IMAGE_NOT_CROPPED) {
        try {
          const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, { uri: imageURL, nsfw: true, uploader, id, crop: false });

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
