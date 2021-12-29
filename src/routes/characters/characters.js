/* eslint-disable max-len */
const {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageAttachment,
} = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const { imageIdentifier } = require('../../util/constants/images');
const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { reviewer } = require('../../util/constants/roles');
const { MAIN_IMAGE } = require('../../util/constants/channels');

const customIds = {
  success: 'success',
  deny: 'deny',
  image: 'better_image_needed',
  description: 'better_description_needed',
  else: 'better ?',
};

const { config } = require('../../util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { characterChannels: { pending, accepted, denied } } = require(config);

const logger = log4js.getLogger();

const croppedDiscordImage = async (bot, id, buffer, imageURLClean) => {
  const channel = bot.channels.cache.get(MAIN_IMAGE);
  if (!channel || !channel.send) {
    logger.error(`COULD NOT FIND CHANNEL ${MAIN_IMAGE}`);
    return;
  }
  const myMessage = await channel.send({ files: [new MessageAttachment(Buffer.from(buffer), imageURLClean)] });
  if (myMessage && myMessage.MessageAttachments && myMessage.MessageAttachments.first
    && myMessage.MessageAttachments.first() && myMessage.MessageAttachments.first().proxyURL) {
    const uri = myMessage.MessageAttachments.first().proxyURL;
    await bongoBotAPI.patch(`/characters/${id}/images/clean-discord`, { uri });
  }
};

route.post('/', async (req, res) => {
  try {
    const channelPending = client.channels.cache.get(pending);
    const channelAccept = client.channels.cache.get(accepted);
    const channelDenied = client.channels.cache.get(denied);

    const {
      name,
      series,
      body,
      imageURL,
      uploader,
      description,
      husbando,
      nsfw,
    } = req.body;

    const reqBody = req.body;
    reqBody.crop = true;

    if (!name || !series || !imageURL || !uploader || !description || husbando === undefined || nsfw == null) {
      channelDenied.send(`Could not upload character: ${name}, ${series} from ${uploader}.`).catch((error) => logger.error(error));
      res.status(400).send({ error: `Invalid character: ${JSON.stringify(req.body)}` });
      return;
    }

    const { status, data: dataImage } = await bongoBotAPI.post('/mims/crop', { imageURL }, { responseType: 'arraybuffer' });
    let buffer = '';
    if (dataImage && status === 200) {
      buffer = dataImage;
    } else {
      logger.error(`could not crop image: ${status}`);
    }

    // eslint-disable-next-line no-nested-ternary
    const gender = husbando == null ? '?' : husbando ? 'male' : 'female';

    const embed = new MessageEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${series} - ${gender} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
      .setTimestamp();

    if (!channelPending) {
      res.status(500).send('Channel not found.');
      return;
    }

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(customIds.success)
          .setLabel('Approve')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId(customIds.deny)
          .setLabel('Deny')
          .setStyle('DANGER'),
        new MessageButton()
          .setCustomId(customIds.image)
          .setLabel('Better Image Needed')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(customIds.description)
          .setLabel('Better Description Needed')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(customIds.else)
          .setLabel('Better ?')
          .setStyle('SECONDARY'),
      );

    const interactionMessage = await channelPending.send({ embeds: [embed], components: [row], files: [new MessageAttachment(Buffer.from(buffer), `cropped.${imageIdentifier(buffer) || 'gif'}`)] });

    const filter = (interaction) => [customIds.success, customIds.deny, customIds.image, customIds.description, customIds.else].includes(interaction.customId);

    const collector = interactionMessage.createMessageComponentCollector(filter, { time: 8.64e+7 });

    const collectorFunction = async (i) => {
      const { member, user } = i;
      if (!member.roles.cache.get(reviewer)) return;

      if (i.customId === customIds.success) {
        try {
          interactionMessage.deferReply().catch((error) => logger.error(error));
          const { status: statusChar, data } = await bongoBotAPI.post('/characters', reqBody).catch((error) => logger.error(error));

          if (statusChar !== 201 && statusChar !== 200) {
            logger.error(`${statusChar} failed to create character`);
            logger.error(data);
            await interactionMessage.edit('`❌` | An error occurred with this character...');
            return;
          }

          const characterEmbed = new MessageEmbed()
            .setTitle(name)
            .setImage(data.url)
            .setURL(data.url)
            .setDescription(`${series} - ${gender} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();

          await channelAccept.send({ embeds: [characterEmbed], content: data.urlCropped || '**Could not crop image**' });
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          await croppedDiscordImage(client, data.id, buffer, data.urlCropped).catch((error) => logger.error(error));

          await uploadUser.send(`\`✅\` | Thanks for uploading **${name}** from **${series}**!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      const characterFailedEmbed = new MessageEmbed()
        .setTitle(name)
        .setImage(imageURL)
        .setURL(imageURL)
        .setDescription(`${series} - ${gender} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
        .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
        .setTimestamp();

      if (i.customId === customIds.deny) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send({ embeds: [characterFailedEmbed] });
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          await uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series}** has been denied. You can still make a custom waifu out of them using the \`customwaifu\` command.`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (i.customId === customIds.description) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send({ embeds: [characterFailedEmbed] });

          await interactionMessage.delete();
          const uploadUser = await client.users.fetch(uploader);
          await uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series} needs a better description**. You can upload a better description and undergo a new review. Thank you!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (i.customId === customIds.image) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send({ embeds: [characterFailedEmbed] });
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          await uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series} needs a better image**. You can upload a better image and undergo a new review. It may be the case where you need to crop the image. **If that's so you can do \`@Bongo#3445 crop image_url_goes_here\` to see what it looks like beforehand.**\nThank you!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (i.customId === customIds.else) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send({ embeds: [characterFailedEmbed] });
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          await uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series} needs several better properties.** You can try fixing the mistakes or join the main server to discuss. Thank you!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
      }
    };

    collector.on('collect', collectorFunction);
    collector.on('end', async () => {
      setTimeout(async () => {
        if (!interactionMessage || interactionMessage.deleted) return;
        await interactionMessage.edit({ components: [] }).catch((error) => logger.error(error));
      }, 5000);
    });

    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
});

module.exports = route;
