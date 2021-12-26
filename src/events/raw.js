/* eslint-disable max-len */
const logger = require('log4js').getLogger();

const { bongoBotAPI } = require('../services/bongo');
const { reviewer } = require('../util/constants/roles');
const { config } = require('../util/constants/paths');
const { PROD } = require('../util/constants/environments');

const {
  imageChannels,
  characterChannels,
  seriesChannels,
  // owner,
  // eslint-disable-next-line import/no-dynamic-require
} = require(config);

const OFFICIAL_SERVER = '335286472921841665';

const imagesHandler = require('../handlers/images');

const customIds = {
  success: 'success',
  deny: 'deny',
  nsfw: 'nsfw',
  nsfw_not_cropped: 'nsfw_not_cropped',
  sfw_not_cropped: 'sfw_not_cropped',
  main_image: 'main_image',
};

const imageHandlerForEmoji = async (customID, handlerData) => {
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
  client.on('raw', async (event) => {
    if (!event) return;

    if (!client || !client.user || !client.user.id) return;

    if (event.t !== 'INTERACTION_CREATE' || !event.d || !event.d.channel_id || event.d.message.id === client.user.id) return;

    try {
      const channel = client.channels.cache.get(event.d.channel_id);
      if (!channel || channel.type !== 'GUILD_TEXT') return;

      const message = channel.messages.cache.get(event.d.message.id) || await channel.messages.fetch(event.d.message.id);
      if (!message || message.deleted || !message.guild || message.guild.id !== OFFICIAL_SERVER || !message.author || message.author.id !== client.user.id) return;

      const channelID = channel.id;
      if (![characterChannels.pending, imageChannels.pending, seriesChannels.pending].includes(channelID)) return;

      const messageID = message.id;
      const { custom_id: customID } = event.d.data;
      const { user } = event.d.member;
      const { member } = event.d;
      if (!member || !member.roles || !member.roles.includes(reviewer)) return;

      user.tag = `${user.username}#${user.discriminator}`;
      user.displayAvatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif`;

      if (channelID === imageChannels.pending) {
        const { status, data } = await bongoBotAPI.get(`/messages/${messageID}/images/pending`);

        if (status !== 200 || !data) {
          logger.error(`error fetching message for image: ${messageID}... Possibly test vs prod bot?`);
          return;
        }

        const channelAccept = client.channels.cache.get(imageChannels.accepted);
        const channelDenied = client.channels.cache.get(imageChannels.denied);

        const {
          waifu_id: characterID,
          body,
          uploader_id: uploaderID,
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
      logger.error(`raw event failed: ${error}`);
    }
  });
};

module.exports = run;
