const {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageAttachment,
} = require('discord.js');
const route = require('express-promise-router')();
const logger = require('log4js').getLogger();

const customIds = {
  success: 'success',
  deny: 'deny',
  nsfw: 'nsfw',
  nsfw_not_cropped: 'nsfw_not_cropped',
  sfw_not_cropped: 'sfw_not_cropped',
  main_image: 'main_image',
};

const { imageIdentifier } = require('../../util/constants/images');
const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { config } = require('../../util/constants/paths');

// eslint-disable-next-line import/no-dynamic-require
const { imageChannels: { pending } } = require(config);

route.post('/', async (req, res) => {
  const channelPending = client.channels.cache.get(pending);

  const {
    name,
    series,
    body,
    imageURL,
    uploader,
    nsfw,
    id,
  } = req.body;

  const { status: statusCharacter, data: dataCharacter } = await bongoBotAPI.get(`/characters/${id}`);
  if (statusCharacter !== 200) {
    logger.error(`error fetching character: ${id}`);
    return res.status(404).send(`error fetching character: ${id}`);
  }

  const { image_url_clean: mainImage } = dataCharacter;

  let buffer = '';
  const { status, data } = await bongoBotAPI.post('/mims/crop', { imageURL }, { responseType: 'arraybuffer' });
  if (data && status === 200) {
    buffer = data;
  }

  const embed = new MessageEmbed()
    .setTitle(name)
    .setImage(imageURL)
    .setURL(imageURL)
    .setThumbnail(mainImage)
    .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
    .setTimestamp();

  if (!channelPending) return res.status(500).send(`no channel named channelPending ${channelPending}`);

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
        .setCustomId(customIds.sfw_not_cropped)
        .setLabel('SFW not cropped')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(customIds.nsfw)
        .setLabel('NSFW')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(customIds.nsfw_not_cropped)
        .setLabel('NSFW not cropped')
        .setStyle('SECONDARY'),
    );

  const row2 = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(customIds.main_image)
        .setLabel('Update Main Image')
        .setStyle('SECONDARY'),
    );

  const interactionMessage = await channelPending.send({ embeds: [embed], files: [new MessageAttachment(Buffer.from(buffer), `cropped.${imageIdentifier(buffer) || 'gif'}`)], components: [row, row2] });

  await bongoBotAPI.post('/messages/images/pending', {
    messageID: interactionMessage.id,
    characterID: id,
    uploaderID: uploader,
    body,
    imageURL,
    nsfw,
  });

  return res.sendStatus(200);
});

module.exports = route;
