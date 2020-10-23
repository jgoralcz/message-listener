const { RichEmbed, Attachment } = require('discord.js');
const route = require('express-promise-router')();
const logger = require('log4js').getLogger();

const { imageIdentifier } = require('../../util/constants/images');
const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { config } = require('../../util/constants/paths');
const {
  APPROVE,
  KEEP_SFW_IMAGE_NOT_CROPPED,
  DENY,
  NSFW,
  KEEP_NSFW_IMAGE_NOT_CROPPED,
  UPDATE_MAIN_IMAGE,
} = require('../../util/constants/emojis');

// eslint-disable-next-line import/no-dynamic-require
const { imageChannels: { pending } } = require(config);

route.post('/', async (req, res) => {
  const channelPending = client.channels.get(pending);

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

  const embed = new RichEmbed()
    .setTitle(name)
    .setImage(imageURL)
    .setURL(imageURL)
    .setThumbnail(mainImage)
    .attachFile(new Attachment(Buffer.from(buffer), `cropped.${imageIdentifier(buffer) || 'gif'}`))
    .setDescription(`${series} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}`)
    .setTimestamp();

  if (!channelPending) return res.status(500).send(`no channel named channelPending ${channelPending}`);
  const reactMessage = await channelPending.send('<:success:473906375064420362> = SFW AND GOOD CROP | <:spray:570827763792085005> = SFW, BUT BAD CROP | <:blacklist:473914756827316236> = NSFW AND GOOD CROP | <:VeggieSad:588560051204259846> = NSFW, BUT BAD CROP | <:failure:473906403019456522> = DELETE | <:2blove:481971390577377280> = SET AS MAIN IMAGE\n\n**CROPPED IMAGE**: ', { embed });

  await bongoBotAPI.post('/messages/images/pending', {
    messageID: reactMessage.id,
    characterID: id,
    uploaderID: uploader,
    body,
    imageURL,
    nsfw,
  });

  await reactMessage.react(APPROVE);
  await reactMessage.react(KEEP_SFW_IMAGE_NOT_CROPPED);
  await reactMessage.react(NSFW);
  await reactMessage.react(KEEP_NSFW_IMAGE_NOT_CROPPED);
  await reactMessage.react(DENY);
  await reactMessage.react(UPDATE_MAIN_IMAGE);

  return res.sendStatus(200);
});

module.exports = route;
