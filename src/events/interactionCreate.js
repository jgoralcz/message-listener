/* eslint-disable max-len */
const logger = require('log4js').getLogger();

const { bongoBotAPI } = require('../services/bongo');
const { reviewer } = require('../util/constants/roles');
const { config } = require('../util/constants/paths');

const {
  imageChannels,
  characterChannels,
  seriesChannels,
  // owner,
  // eslint-disable-next-line import/no-dynamic-require
} = require(config);

const OFFICIAL_SERVER = '335286472921841665';

const imagesHandler = require('../handlers/images');
const { addBankPoints } = require('../services/user');

const customIds = {
  success: 'success',
  deny: 'deny',
  nsfw: 'nsfw',
  nsfw_not_cropped: 'nsfw_not_cropped',
  sfw_not_cropped: 'sfw_not_cropped',
  main_image: 'main_image',
};

const extractNumber = (text) => {
  const regex = /\((\d+)\)/;
  const match = text.match(regex);
  return match ? match[1] : null;
};

const imageHandlerForEmoji = async (customID, handlerData) => {
  await addBankPoints(handlerData.user.id, 1000);
  if (customID === customIds.success) {
    return imagesHandler.approved(handlerData);
  }
  if (customID === customIds.deny) {
    return imagesHandler.denied(handlerData);
  }
  if (customID === customIds.nsfw) {
    return imagesHandler.nsfwImage(handlerData);
  }
  if (customID === customIds.nsfw_not_cropped) {
    return imagesHandler.nsfwNotCropped(handlerData);
  }
  if (customID === customIds.sfw_not_cropped) {
    return imagesHandler.sfwNotCropped(handlerData);
  }
  if (customID === customIds.main_image) {
    return imagesHandler.updateMainImage(handlerData);
  }
  logger.error(`custom ID: ${customID} not a match.`);

  return undefined;
};

const run = (client) => {
  client.on('interactionCreate', async (interaction) => {
    try {
      const channel = client.channels.cache.get(interaction.channelId);
      if (!channel || channel.type !== 'GUILD_TEXT' || !interaction.message || !interaction.message.id) return;

      const message = channel.messages.cache.get(interaction.message.id) || await channel.messages.fetch(interaction.message.id);
      if (!message || message.deleted || !message.guild || message.guild.id !== OFFICIAL_SERVER || !message.author || message.author.id !== client.user.id) return;

      const channelID = channel.id;
      if (![characterChannels.pending, imageChannels.pending, seriesChannels.pending].includes(channelID)) return;

      const messageID = message.id;
      const { member, user, customId: customID } = interaction;
      if (!member || !member.roles || !member.roles.cache || !member.roles.cache.get(reviewer)) return;

      if (channelID === imageChannels.pending) {
        let { status, data } = await bongoBotAPI.get(`/messages/${messageID}/images/pending`);

        const embed = message.embeds[0];
        if (status !== 200 || !data) {
          logger.error(`error fetching message for image: ${messageID}... Possibly test vs prod bot?`);
          if (!message.embeds || message.embeds.length <= 0) {
            logger.error(`no embeds found for ${messageID}`);
            return;
          }

          const name = embed.title;

          const splitSeries = embed.description.split('-');
          splitSeries.pop();
          const series = splitSeries.join('-').trim();

          // TODO: parse name and series out from embed
          const { status, data: characterData } = await bongoBotAPI.get(`/characters/?name=${name}&series=${series}`);
          if (status !== 200) {
            logger.error(`error fetching character: ${name} ${series}`);
            return;
          }
          data = characterData;
          return;
        }

        const channelAccept = client.channels.cache.get(imageChannels.accepted);
        const channelDenied = client.channels.cache.get(imageChannels.denied);

        const uploaderID = extractNumber(embed.description);

        const {
          waifu_id: characterID,
          body,
          // uploader_id: uploaderID,
          image_url: imageURL,
          nsfw,
        } = data;

        const { status: statusCharacter, data: dataCharacter } = await bongoBotAPI.get(`/characters/${characterID}`);
        if (statusCharacter !== 200) {
          logger.error(`error fetching character: ${characterID}`);
          return;
        }

        const {
          name,
          series,
          image_url_clean: imageURLClean,
        } = dataCharacter;

        const handlerData = {
          interaction,
          client,
          channelAccept,
          channelDenied,
          interactionMessage: message,
          user,
          name,
          id: characterID,
          imageURL,
          mainImage: imageURLClean,
          series,
          body,
          uploader: uploaderID,
          nsfw,
        };

        const success = await imageHandlerForEmoji(customID, handlerData);

        if (!success) {
          logger.error(`operation not successful for customID ${customID}`);
          return;
        }

        const { status: statusDelete } = await bongoBotAPI.delete(`/messages/${messageID}/images/pending`);
        if (statusDelete !== 204) {
          logger.error(`Could not delete pending image from database with messageID: ${messageID} and status code: ${statusDelete}`);
        }

        return;
      }

      if (channelID === characterChannels.pending) {
        return;
      }

      if (channelID === seriesChannels.pending) {
        return;
      }
    } catch (error) {
      logger.error(`interactionCrate failed: ${error}`);
    }
  });
};

module.exports = run;
