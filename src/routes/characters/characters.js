const { RichEmbed, Attachment } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');
const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { characterChannels: { pending, accepted, denied } } = require('../../../config.json');
const { reviewer } = require('../../util/constants/roles');
const { MAIN_IMAGE } = require('../../util/constants/channels');
const {
  APPROVE,
  DENY,
  BETTER_DESCRIPTION_NEEEDED,
  BETTER_IMAGE_NEEDED,
  BETTER_EVERYTHING_NEEDED,
} = require('../../util/constants/emojis');

const logger = log4js.getLogger();

const croppedDiscordImage = async (bot, id, buffer, imageURLClean) => {
  const channel = bot.channels.get(MAIN_IMAGE);
  if (!channel || !channel.send) {
    logger.error(`COULD NOT FIND CHANNEL ${MAIN_IMAGE}`);
    return;
  }
  const myMessage = await channel.send(new Attachment(Buffer.from(buffer), imageURLClean));
  if (myMessage && myMessage.attachments && myMessage.attachments.first
    && myMessage.attachments.first() && myMessage.attachments.first().proxyURL) {
    const uri = myMessage.attachments.first().proxyURL;
    await bongoBotAPI.patch(`/characters/${id}/images/clean-discord`, { uri });
  }
};

route.post('/', async (req, res) => {
  try {
    const channelPending = client.channels.get(pending);
    const channelAccept = client.channels.get(accepted);
    const channelDenied = client.channels.get(denied);

    const {
      name, series, body, imageURL, uploader, description, husbando, unknownGender, nsfw,
    } = req.body;

    if (!name || !series || !imageURL || !uploader || !description || husbando == null || unknownGender == null || nsfw == null) {
      channelDenied.send(`Could not upload character: ${name}, ${series} from ${uploader}.`).catch((error) => logger.error(error));
      return res.status(400).send({ error: `Invalid character: ${JSON.stringify(req.body)}` });
    }

    let buffer = '';
    try {
      const { status, data } = await bongoBotAPI.post('/mims/crop', { imageURL, width: 300, height: 467 }, { responseType: 'arraybuffer' });
      if (data && status === 200) {
        buffer = data;
      }
    } catch (error) {
      logger.error(error);
    }

    const gender = (unknownGender) ? '?' : (husbando) ? 'male' : 'female';

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .attachFile(new Attachment(Buffer.from(buffer), 'cropped.gif'))
      .setDescription(`${series} - ${gender} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
      .setTimestamp();

    if (!channelPending) return res.status(500).send('Channel not found.');
    const reactMessage = await channelPending.send(`<:success:473906375064420362> = GOOD **|** <:failure:473906403019456522> = DELETE **|** ${BETTER_IMAGE_NEEDED} = BETTER IMAGE (OR CROPPED IMAGE) NEEDED **|** ${BETTER_DESCRIPTION_NEEEDED} = BETTER DESCRIPTION NEEDED **|** ${BETTER_EVERYTHING_NEEDED} = BETTER SOMETHING ELSE NEEDED`, { embed });

    const filter = (reaction, user) => (
      reaction.emoji.id === APPROVE
      || reaction.emoji.id === DENY
      || reaction.emoji.name === BETTER_IMAGE_NEEDED
      || reaction.emoji.name === BETTER_DESCRIPTION_NEEEDED
      || reaction.emoji.name === BETTER_EVERYTHING_NEEDED
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 60000000 });

    await reactMessage.react(APPROVE);
    await reactMessage.react(DENY);
    await reactMessage.react(BETTER_IMAGE_NEEDED);
    await reactMessage.react(BETTER_DESCRIPTION_NEEEDED);
    await reactMessage.react(BETTER_EVERYTHING_NEEDED);

    const collectorFunction = async (r) => {
      if (r == null || !r.emoji || !r.fetchUsers) return;

      await r.fetchUsers();
      const user = r.users.filter((u) => !u.bot).last();
      if (user == null) return;

      const member = await reactMessage.guild.fetchMember(user).catch(() => null);
      if (!member.roles.get(reviewer)) return;

      if (r.emoji.id === APPROVE) {
        try {
          const { status, data } = await bongoBotAPI.post('/characters', req.body).catch((error) => logger.error(error));

          const characterEmbed = new RichEmbed()
            .setTitle(name)
            .setImage(data.url)
            .setURL(data.url)
            .setDescription(`${series} - ${gender} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();

          if (data.urlCropped) {
            characterEmbed.attachFile(data.urlCropped);
            characterEmbed.setThumbnail(data.urlCropped);
          }

          await channelAccept.send(data.urlCropped || '**Could not crop image**', { embed: characterEmbed });
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          await croppedDiscordImage(client, data.id, buffer, data.urlCropped).catch((error) => logger.error(error));

          uploadUser.send(`\`✅\` | Thanks for uploading **${name}** from **${series}**!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      const characterFailedEmbed = new RichEmbed()
        .setTitle(name)
        .setImage(imageURL)
        .setURL(imageURL)
        .setDescription(`${series} - ${gender} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
        .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
        .setTimestamp();

      if (r.emoji.id === DENY) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send(characterFailedEmbed);
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series}** has been denied. You can still make a custom waifu out of them using the \`customwaifu\` command.`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }
      if (r.emoji.name === BETTER_DESCRIPTION_NEEEDED) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send(characterFailedEmbed);

          await reactMessage.delete();
          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series} needs a better description**. You can upload a better description and undergo a new review. Thank you!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }
      if (r.emoji.name === BETTER_IMAGE_NEEDED) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send(characterFailedEmbed);
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series} needs a better image**. You can upload a better image and undergo a new review. Thank you!`);
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }
      if (r.emoji.name === BETTER_EVERYTHING_NEEDED) {
        try {
          logger.info(`Deleted: ${name}, ${series}, ${imageURL}`);

          await channelDenied.send(characterFailedEmbed);
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series} needs several better properties.** You can try fixing the mistakes or join the main server to discuss. Thank you!`);
        } catch (error) {
          logger.error(error);
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
