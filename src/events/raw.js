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

const {
  APPROVE,
  KEEP_SFW_IMAGE_NOT_CROPPED,
  DENY,
  NSFW,
  KEEP_NSFW_IMAGE_NOT_CROPPED,
  UPDATE_MAIN_IMAGE,
} = require('../util/constants/emojis');


const imageHandlerForEmoji = async (emojiID, handlerData) => {
  if (emojiID === APPROVE) {
    return imagesHandler.approved(handlerData);
  }
  if (emojiID === DENY) {
    return imagesHandler.denied(handlerData);
  }
  if (emojiID === NSFW) {
    return imagesHandler.nsfwImage(handlerData);
  }
  if (emojiID === KEEP_NSFW_IMAGE_NOT_CROPPED) {
    return imagesHandler.nsfwNotCropped(handlerData);
  }
  if (emojiID === KEEP_SFW_IMAGE_NOT_CROPPED) {
    return imagesHandler.sfwNotCropped(handlerData);
  }
  if (emojiID === UPDATE_MAIN_IMAGE) {
    return imagesHandler.updateMainImage(handlerData);
  }
  // const ownerUser = await client.fetchUser(owner);
  // ownerUser.send(`emoji ID: ${emoji.id} not found`).catch((err) => logger.error(err));
  logger.error(`emoji ID: ${emojiID} not a match.`);

  return undefined;
};

const run = (client) => {
  client.on('raw', async (event) => {
    if (!event) return;

    if (!client || !client.user || !client.user.id) return;

    if (event.t !== 'MESSAGE_REACTION_ADD' || !event.d || !event.d.channel_id
      || event.d.user_id === client.user.id || !event.d.member
      || !event.d.member.user || !event.d.member.user.id
    ) return;

    try {
      const channel = client.channels.get(event.d.channel_id);
      if (!channel || channel.type !== 'text') return;

      const message = channel.messages.get(event.d.message_id) || await channel.fetchMessage(event.d.message_id);

      if (!message || message.deleted || !message.guild || message.guild.id !== OFFICIAL_SERVER
        || !message.author || message.author.id !== client.user.id
      ) return;

      const channelID = channel.id;
      if (![characterChannels.pending, imageChannels.pending, seriesChannels.pending].includes(channelID)) return;

      const emoji = message.guild.emojis.get(event.d.emoji.id);
      if (!emoji) return;

      const emojiID = emoji.id;
      const messageID = message.id;

      const { user } = event.d.member;
      const member = await message.guild.fetchMember(user.id).catch((error) => logger.error(error));
      if (!member || !member.roles || !member.roles.get(reviewer)) return;

      user.tag = `${user.username}#${user.discriminator}`;
      user.displayAvatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif`;

      if (channelID === imageChannels.pending) {
        const { status, data } = await bongoBotAPI.get(`/messages/${messageID}/images/pending`);

        if (status !== 200 || !data) {
          logger.error(`error fetching message for image: ${messageID}... Possibly test vs prod bot?`);
          return;
        }

        const channelAccept = client.channels.get(imageChannels.accepted);
        const channelDenied = client.channels.get(imageChannels.denied);

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
          reactMessage: message,
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

        const success = await imageHandlerForEmoji(emojiID, handlerData);

        if (!success) {
          logger.error(`operation not successful for emojiID ${emojiID}`);
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
