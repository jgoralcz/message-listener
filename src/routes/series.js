const { RichEmbed } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../index');
const { bongoBotAPI } = require('../services/bongo');
const { config } = require('../util/constants/paths');
const { reviewer } = require('../util/constants/roles');

// eslint-disable-next-line import/no-dynamic-require
const { seriesChannels: { pending, accepted, denied } } = require(config);

const {
  APPROVE,
  DENY,
  BETTER_DESCRIPTION_NEEEDED,
  BETTER_IMAGE_NEEDED,
  BETTER_EVERYTHING_NEEDED,
} = require('../util/constants/emojis');

route.post('/', async (req, res) => {
  try {
    const channelPending = client.channels.get(pending);
    const channelAccept = client.channels.get(accepted);
    const channelDenied = client.channels.get(denied);

    const {
      name, body, imageURL, uploader, description, nsfw, is_western: western, is_game: game,
    } = req.body;

    if (!name || !imageURL || !uploader || !description || western == null || nsfw == null) {
      await channelDenied.send(`Could not upload series: ${name} from ${uploader}.`).catch((error) => logger.error(error));
      return res.status(400).send({ error: `Invalid series: ${JSON.stringify(req.body)}` });
    }

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${(game) ? 'GAME - ' : ''}${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
      .setTimestamp();

    if (!channelPending) return res.status(500).send('Channel not found.');

    const reactMessage = await channelPending.send(`<:success:473906375064420362> = GOOD **|** <:failure:473906403019456522> = DELETE **|** ${BETTER_IMAGE_NEEDED} = BETTER IMAGE NEEDED **|** ${BETTER_DESCRIPTION_NEEEDED} = BETTER DESCRIPTION NEEDED **|** ${BETTER_EVERYTHING_NEEDED} = BETTER SOMETHING ELSE NEEDED`, { embed });

    const filter = (reaction, user) => (
      reaction.emoji.id === APPROVE
      || reaction.emoji.id === DENY
      || reaction.emoji.name === BETTER_IMAGE_NEEDED
      || reaction.emoji.name === BETTER_DESCRIPTION_NEEEDED
      || reaction.emoji.name === BETTER_EVERYTHING_NEEDED
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 8.64e+7 });

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
          const { data } = await bongoBotAPI.post('/series', req.body);

          const seriesEmbed = new RichEmbed()
            .setTitle(name)
            .setImage(data.url)
            .setURL(data.url)
            .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${(game) ? 'GAME - ' : ''}${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
            .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
            .setTimestamp();
          await channelAccept.send({ embed: seriesEmbed });
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          await uploadUser.send(`\`✅\` | Thanks for uploading the series **${name}**!`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      const seriesFailedEmbed = new RichEmbed()
        .setTitle(name)
        .setImage(imageURL)
        .setURL(imageURL)
        .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${(game) ? 'GAME - ' : ''}${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
        .setFooter(`${user.tag} (${user.id})`, user.displayAvatarURL)
        .setTimestamp();

      if (r.emoji.id === DENY) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send(seriesFailedEmbed).catch((error) => logger.error(error));
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          await uploadUser.send(`\`❌\` | Sorry, your submitted series **${name}** has been denied. You can still make a custom waifu and add it to its own series using the \`customwaifu\` command.`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (r.emoji.name === BETTER_DESCRIPTION_NEEEDED) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send(seriesFailedEmbed).catch((error) => logger.error(error));
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** needs a better description**. You can upload a better description and undergo a new review. Thank you!`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (r.emoji.name === BETTER_IMAGE_NEEDED) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send(seriesFailedEmbed).catch((error) => logger.error(error));
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** needs a better image**. You can upload a better image and undergo a new review. Thank you!`).catch((error) => logger.error(error));
        } catch (error) {
          logger.error(error);
        }
        collector.stop();
        return;
      }

      if (r.emoji.name === BETTER_EVERYTHING_NEEDED) {
        try {
          logger.info(`Deleted: ${name}, ${imageURL}`);

          await channelDenied.send(seriesFailedEmbed);
          await reactMessage.delete();

          const uploadUser = await client.fetchUser(uploader);
          uploadUser.send(`\`❌\` | Sorry, **${name}** needs several better properties.** You can try fixing the mistakes or join the main server to discuss. Thank you!`).catch((error) => logger.error(error));
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
