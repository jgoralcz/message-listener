/* eslint-disable max-len */
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../index');
const { bongoBotAPI } = require('../services/bongo');
const { config } = require('../util/constants/paths');
const { reviewer } = require('../util/constants/roles');

// eslint-disable-next-line import/no-dynamic-require
const { seriesChannels: { pending, accepted, denied } } = require(config);

const customIds = {
  success: 'success',
  deny: 'deny',
  image: 'better_image_needed',
  description: 'better_description_needed',
  else: 'better ?',
};

route.post('/', async (req, res) => {
  try {
    const channelPending = client.channels.cache.get(pending);
    const channelAccept = client.channels.cache.get(accepted);
    const channelDenied = client.channels.cache.get(denied);

    const {
      name,
      body,
      imageURL,
      uploader,
      description,
      nsfw,
      is_western: western,
      is_game: game,
    } = req.body;

    if (!name || !imageURL || !uploader || !description || western == null || nsfw == null) {
      await channelDenied.send(`Could not upload series: ${name} from ${uploader}.`).catch((error) => logger.error(error));
      return res.status(400).send({ error: `Invalid series: ${JSON.stringify(req.body)}` });
    }

    const embed = new MessageEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${(game) ? 'GAME - ' : ''}${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
      .setTimestamp();

    if (!channelPending) return res.status(500).send('Channel not found.');

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

    const interactionMessage = await channelPending.send({ embeds: [embed], components: [row] });

    const filter = (interaction) => [customIds.success, customIds.deny, customIds.image, customIds.description, customIds.else].includes(interaction.customId);

    const collector = interactionMessage.createMessageComponentCollector(filter, { time: 8.64e+7 });

    const collectorFunction = async (i) => {
      const { member, user } = i;
      if (!member.roles.cache.get(reviewer)) return;

      if (i.customId === customIds.success) {
        await i.deferReply({ ephemeral: true }).catch((error) => logger.error(error));
        try {
          const { data } = await bongoBotAPI.post('/series', req.body);

          const seriesEmbed = new MessageEmbed()
            .setTitle(name)
            .setImage(data.url)
            .setURL(data.url)
            .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${(game) ? 'GAME - ' : ''}${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();

          await channelAccept.send({ embeds: [seriesEmbed] });
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          await uploadUser.send(`\`✅\` | Thanks for uploading the series **${name}**!`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      const seriesFailedEmbed = new MessageEmbed()
        .setTitle(name)
        .setImage(imageURL)
        .setURL(imageURL)
        .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${(game) ? 'GAME - ' : ''}${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
        .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
        .setTimestamp();

      if (i.customId === customIds.deny) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send({ embeds: [seriesFailedEmbed] }).catch((error) => logger.error(error));
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          await uploadUser.send(`\`❌\` | Sorry, your submitted series **${name}** has been denied. You can still make a custom waifu and add it to its own series using the \`customwaifu\` command.`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (i.customId === customIds.description) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send({ embeds: [seriesFailedEmbed] }).catch((error) => logger.error(error));
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** needs a better description. You can upload a better description and undergo a new review. Thank you!`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (i.customId === customIds.image) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send({ embeds: [seriesFailedEmbed] }).catch((error) => logger.error(error));
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** needs a better image. You can upload a better image and undergo a new review. Thank you!`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (i.customId === customIds.else) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send({ embeds: [seriesFailedEmbed] });
          await interactionMessage.delete();

          const uploadUser = await client.users.fetch(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** needs several better properties.** You can try fixing the mistakes or join the main server to discuss. Thank you!`).catch((error) => logger.error(error));
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
