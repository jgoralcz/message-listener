const { RichEmbed, Attachment } = require('discord.js');
const logger = require('log4js').getLogger();

const { getBuffer } = require('../util/constants/images');
const { bongoBotAPI } = require('../services/bongo');
const { OTHER_IMAGES } = require('../util/constants/channels');
const { PROD } = require('../util/constants/environments');

const croppedDiscordImageOther = async (bot, id, buffer, imageURLClean) => {
  const channel = bot.channels.get(OTHER_IMAGES);
  if (!channel || !channel.send) {
    logger.error(`COULD NOT FIND CHANNEL ${OTHER_IMAGES}`);
    return undefined;
  }

  const myMessage = await channel.send(new Attachment(Buffer.from(buffer), imageURLClean));
  if (myMessage && myMessage.attachments && myMessage.attachments.first
    && myMessage.attachments.first() && myMessage.attachments.first().proxyURL) {
    const uri = myMessage.attachments.first().proxyURL;
    await bongoBotAPI.patch(`/images/${id}/clean-discord`, { uri }).catch((error) => logger.error(error));
    return uri;
  }

  return undefined;
};

const notAutocropped = 'However, it could not be autocropped. You can view the image by changing your crop settings in the `mysettings` command.';
const nsfwChannelOnly = 'You can view these images in a NSFW channel.';

const approved = async ({
  client,
  channelAccept,
  reactMessage,
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

    const sfwEmbed = new RichEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - SFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
      .setThumbnail(mainImage)
      .setTimestamp();

    if (data.urlCropped) {
      sfwEmbed.attachFile(data.urlCropped);
    }

    await channelAccept.send(data.urlCropped || '**Could not crop image**', { embed: sfwEmbed });
    await reactMessage.delete();

    const buffer = await getBuffer(data.urlCropped);
    await croppedDiscordImageOther(client, id, buffer, data.urlCropped).catch((error) => logger.error(error));

    const uploadUser = await client.fetchUser(uploader);
    await uploadUser.send(`\`✅\` | Your SFW (Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}`);
    return true;
  } catch (error) {
    logger.error(error);
    await reactMessage.edit('`❌` | An error occurred with this image...');
  }
  return false;
};

const sfwNotCropped = async ({
  client,
  channelAccept,
  reactMessage,
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
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw: false,
      uploader,
      id,
      crop: false,
    });

    if (process.env.NODE_ENV !== PROD) return undefined;

    const sfwEmbed = new RichEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - SFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelAccept.send({ embed: sfwEmbed });
    await reactMessage.delete();

    const uploadUser = await client.fetchUser(uploader);
    await uploadUser.send(`\`✅\` | Your SFW (Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${notAutocropped}`);
    return true;
  } catch (error) {
    logger.error(error);
    await reactMessage.edit('`❌` | An error occurred with this image...');
  }
  return false;
};

const nsfwNotCropped = async ({
  client,
  channelAccept,
  reactMessage,
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
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw: true,
      uploader,
      id,
      crop: false,
    });

    if (process.env.NODE_ENV !== PROD) return undefined;

    const nsfwEmbed = new RichEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - NSFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelAccept.send({ embed: nsfwEmbed });
    await reactMessage.delete();

    const uploadUser = await client.fetchUser(uploader);
    await uploadUser.send(`\`✅\` | Your NSFW (Not Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${nsfwChannelOnly} ${notAutocropped}`);
    return true;
  } catch (error) {
    logger.error(error);
    await reactMessage.edit('`❌` | An error occurred with this image...');
  }
  return false;
};

const denied = async ({
  client,
  channelDenied,
  reactMessage,
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

    const embedDenied = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
      .setThumbnail(mainImage)
      .setTimestamp();

    await channelDenied.send(embedDenied);
    await reactMessage.delete();

    const uploadUser = await client.fetchUser(uploader);
    await uploadUser.send(`\`❌\` | ${imageURL} for **${name}** from **${series}** has been denied. Try to upload high quality and relevant images. Thank you!`);
    return true;
  } catch (error) {
    logger.error(error);
    await reactMessage.edit('`❌` | An error occurred with this image...');
  }
  return false;
};

const nsfwImage = async ({
  client,
  channelAccept,
  reactMessage,
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
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw: true,
      uploader,
      id,
      crop: true,
    });

    if (process.env.NODE_ENV !== PROD) return undefined;

    const nsfwEmbed = new RichEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - NSFW\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
      .setThumbnail(mainImage)
      .setTimestamp();

    if (data.urlCropped) {
      nsfwEmbed.attachFile(data.urlCropped);
    }

    const buffer = await getBuffer(data.urlCropped);
    await croppedDiscordImageOther(client, id, buffer, data.urlCropped).catch((error) => logger.error(error));

    await channelAccept.send(data.urlCropped || '**Could not crop image**', { embed: nsfwEmbed });
    await reactMessage.delete();

    const uploadUser = await client.fetchUser(uploader);
    await uploadUser.send(`\`✅\` | Your NSFW (Not Safe For Work) image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${nsfwChannelOnly}`);
    return true;
  } catch (error) {
    logger.error(error);
    await reactMessage.edit('`❌` | An error occurred with this image...');
  }
  return false;
};

const updateMainImage = async ({
  client,
  channelAccept,
  reactMessage,
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
    const { data } = await bongoBotAPI.post(`/characters/${id}/images/`, {
      uri: imageURL,
      nsfw,
      uploader,
      id,
      crop: true,
    });

    const isNSFWstr = (nsfw) ? 'NSFW' : 'SFW';

    if (process.env.NODE_ENV !== PROD) return undefined;

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(data.url)
      .setURL(data.url)
      .setDescription(`${series} - ${isNSFWstr}\n${body}`)
      .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
      .setThumbnail(mainImage)
      .setTimestamp();

    if (data.urlCropped) {
      embed.attachFile(data.urlCropped);
    }

    const buffer = await getBuffer(data.urlCropped);
    const discordCropURL = await croppedDiscordImageOther(client, id, buffer, data.urlCropped).catch((error) => logger.error(error));

    const uploadUser = await client.fetchUser(uploader);
    await uploadUser.send(`\`✅\` | Your ${nsfw ? 'NSFW (Not Safe For Work)' : 'SFW (Safe For Work)'} image for **${name}** from **${series}** has been uploaded to: ${data.url}. ${nsfw ? '' : 'It will also be used as the main image! Thank you for your help'}`).catch(error => logger.error(error));

    if (nsfw) {
      await reactMessage.edit('`❌` | Cannot set main image as a NSFW image!');
      await reactMessage.clearReactions().catch((error) => logger.error(error));
      return false;
    }

    if (!data.url || !data.urlCropped || !discordCropURL) {
      await reactMessage.edit('`❌` | Could not generate cropped images correctly for main image');
      await reactMessage.clearReactions().catch((error) => logger.error(error));
      return false;
    }

    const { status: statusUpdatedImage } = await bongoBotAPI.patch(`/characters/${id}/image`, {
      imageURL: data.url,
      cropURL: data.urlCropped,
      discordCropURL,
    });

    if (statusUpdatedImage !== 201) {
      logger.error(`An error occurred when updating the image ${statusUpdatedImage}`);
      await reactMessage.edit('`❌` | An error occurred when updating the main image...');
      await reactMessage.clearReactions().catch((error) => logger.error(error));
      return false;
    }

    await channelAccept.send(`Successfully set ${data.urlCropped} as main image`, { embed });

    await reactMessage.delete();
    return true;
  } catch (error) {
    logger.error(error);
    await reactMessage.edit('`❌` | An error occurred with this image...');
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
