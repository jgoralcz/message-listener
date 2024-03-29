/* eslint-disable max-len */
const { MessageEmbed, MessageAttachment } = require('discord.js');
const logger = require('log4js').getLogger();

const { getBuffer } = require('../util/constants/images');
const { bongoBotAPI } = require('../services/bongo');
const { OTHER_IMAGES } = require('../util/constants/channels');
const { PROD } = require('../util/constants/environments');
const { addBankPoints } = require('../services/user');

const notAutocropped = 'However, it could not be autocropped. You can view the image by changing your crop settings in the `mysettings` command.';
const nsfwChannelOnly = 'You can view these images in a NSFW channel.';

const approved = async ({
  interaction,
  client,
  channelAccept,
  interactionMessage,
  user,
  name,
  id,
  imageURL,
  mainImage,
  series,
  body,
  uploader,
}) => {
  try {
    await interaction.deferUpdate().catch((error) => logger.error(error));
    const { status, data } = await bongoBotAPI.post(`/characters/${id}/images`, {
      uri: imageURL,
      nsfw: false,
      uploader,
      id,
      crop: true,
    });

    if (status !== 201) {
      logger.error(`status: ${status} error when uploading new approved image with characterID: ${id} and imageURL: ${imageURL}`);
      logger.error(data);
      return false;
    }

    if (process.env.NODE_ENV !== PROD) return undefined;

    await interactionMessage.delete().catch((error) => logger.error(error));

    const sfwEmbed = new MessageEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - SFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL())
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelAccept.send({ embeds: [sfwEmbed], content: data.urlCropped || '**Could not crop image**', files: [data.urlCropped] }).catch((error) => logger.error(error));

    await addBankPoints(uploader, 5000);
    const uploadUser = await client.users.fetch(uploader);
    await uploadUser.send(`\`✅\` | Your SFW (Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}`).catch((error) => logger.error(error));
    return true;
  } catch (error) {
    logger.error(error);
    await interactionMessage.edit('`❌` | An error occurred with this image...').catch((e) => logger.error(e));
  }
  return false;
};

const sfwNotCropped = async ({
  interaction,
  client,
  channelAccept,
  interactionMessage,
  user,
  name,
  id,
  imageURL,
  mainImage,
  series,
  body,
  uploader,
}) => {
  try {
    await interaction.deferUpdate().catch((error) => logger.error(error));
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw: false,
      uploader,
      id,
      crop: false,
    });

    if (process.env.NODE_ENV !== PROD) return undefined;

    const sfwEmbed = new MessageEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - SFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL())
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelAccept.send({ embeds: [sfwEmbed] }).catch((error) => logger.error(error));
    await interactionMessage.delete();

    const uploadUser = await client.users.fetch(uploader);
    await uploadUser.send(`\`✅\` | Your SFW (Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${notAutocropped}`).catch((error) => logger.error(error));
    return true;
  } catch (error) {
    logger.error(error);
    await interactionMessage.edit('`❌` | An error occurred with this image...').catch((e) => logger.error(e));
  }
  return false;
};

const nsfwNotCropped = async ({
  interaction,
  client,
  channelAccept,
  interactionMessage,
  user,
  name,
  id,
  imageURL,
  mainImage,
  series,
  body,
  uploader,
}) => {
  try {
    await interaction.deferUpdate().catch((error) => logger.error(error));
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw: true,
      uploader,
      id,
      crop: false,
    });

    if (process.env.NODE_ENV !== PROD) return undefined;

    const nsfwEmbed = new MessageEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - NSFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL())
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelAccept.send({ embeds: [nsfwEmbed] }).catch((error) => logger.error(error));
    await interactionMessage.delete();

    const uploadUser = await client.users.fetch(uploader);
    await uploadUser.send(`\`✅\` | Your NSFW (Not Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${nsfwChannelOnly} ${notAutocropped}`).catch((error) => logger.error(error));
    return true;
  } catch (error) {
    logger.error(error);
    await interactionMessage.edit('`❌` | An error occurred with this image...').catch((e) => logger.error(e));
  }
  return false;
};

const denied = async ({
  interaction,
  client,
  channelDenied,
  interactionMessage,
  user,
  name,
  imageURL,
  mainImage,
  series,
  body,
  uploader,
  nsfw,
}) => {
  try {
    // await bongoBotAPI.delete(`/images/${id}`);
    logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

    if (process.env.NODE_ENV !== PROD) return undefined;

    const embedDenied = new MessageEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL())
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelDenied.send({ embeds: [embedDenied] }).catch((error) => logger.error(error));
    await interactionMessage.delete();

    const uploadUser = await client.users.fetch(uploader);
    await uploadUser.send(`\`❌\` | ${imageURL} for **${name}** from **${series}** has been denied. Try to upload high quality and relevant images. Thank you!`).catch((error) => logger.error(error));
    return true;
  } catch (error) {
    logger.error(error);
    await interactionMessage.edit('`❌` | An error occurred with this image...').catch((e) => logger.error(e));
  }
  return false;
};

const nsfwImage = async ({
  interaction,
  client,
  channelAccept,
  interactionMessage,
  user,
  name,
  id,
  imageURL,
  mainImage,
  series,
  body,
  uploader,
}) => {
  try {
    await interaction.deferUpdate().catch((error) => logger.error(error));
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw: true,
      uploader,
      id,
      crop: true,
    });

    if (process.env.NODE_ENV !== PROD) return undefined;

    const nsfwEmbed = new MessageEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - NSFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL())
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelAccept.send({ embeds: [nsfwEmbed], content: data.urlCropped || '**Could not crop image**', files: [data.urlCropped] }).catch((error) => logger.error(error));
    await interactionMessage.delete();

    const uploadUser = await client.users.fetch(uploader);
    await uploadUser.send(`\`✅\` | Your NSFW (Not Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${nsfwChannelOnly}`).catch((error) => logger.error(error));
    return true;
  } catch (error) {
    logger.error(error);
    await interactionMessage.edit('`❌` | An error occurred with this image...').catch((e) => logger.error(e));
  }
  return false;
};

const updateMainImage = async ({
  interaction,
  client,
  channelAccept,
  interactionMessage,
  user,
  name,
  id,
  imageURL,
  mainImage,
  series,
  body,
  uploader,
  nsfw,
}) => {
  try {
    await interaction.deferUpdate().catch((error) => logger.error(error));
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw,
      uploader,
      id,
      crop: true,
    });

    const isNSFWstr = (nsfw) ? 'NSFW' : 'SFW';

    if (process.env.NODE_ENV !== PROD) return undefined;

    const embed = new MessageEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - ${isNSFWstr}\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL())
      .setThumbnail(mainImage)
      .setTimestamp();

    const uploadUser = await client.users.fetch(uploader);
    await uploadUser.send(`\`✅\` | Your ${nsfw ? 'NSFW (Not Safe For Work)' : 'SFW (Safe For Work)'} image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${nsfw ? '' : 'It will also be used as the main image! Thank you for your help'}`).catch((error) => logger.error(error));

    if (nsfw) {
      await interactionMessage.edit({ content: '`❌` | Cannot set main image as a NSFW image!', components: [] }).catch((error) => logger.error(error));
      return false;
    }

    const discordCropURL = data.urlCropped;

    if (!data.url || !data.urlCropped || !discordCropURL) {
      await interactionMessage.edit({ content: '`❌` | Cannot find any image!', components: [] }).catch((error) => logger.error(error));
      return false;
    }

    const { status: statusUpdatedImage } = await bongoBotAPI.patch(`/characters/${id}/image`, {
      imageURL: data.url,
      cropURL: data.urlCropped,
      discordCropURL,
    });

    if (statusUpdatedImage !== 201) {
      logger.error(`An error occurred when updating the image ${statusUpdatedImage}`);
      await interactionMessage.edit({ content: '`❌` | An error occurred when updating the main image...', components: [] }).catch((error) => logger.error(error));
      return false;
    }

    await channelAccept.send({ embeds: [embed], content: data.urlCropped || '**Could not crop image**', files: [data.urlCropped] }).catch((error) => logger.error(error));

    await interactionMessage.delete();
    await addBankPoints(uploader, 25000);
    return true;
  } catch (error) {
    logger.error(error);
    await interactionMessage.edit('`❌` | An error occurred with this image...').catch((e) => logger.error(e));
  }
  return false;
};

module.exports = {
  approved,
  sfwNotCropped,
  nsfwNotCropped,
  denied,
  nsfwImage,
  updateMainImage,
};
