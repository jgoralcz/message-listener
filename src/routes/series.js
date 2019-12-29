const { RichEmbed } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../index');
const { bongoBotAPI } = require('../services/bongo');
const { seriesChannel, voteChannel } = require('../../config.json');
const { reviewer } = require('../util/constants/roles');

const { APPROVE, DENY } = require('../util/constants/emojis');

route.post('/', async (req, res) => {
  try {
    const channel = client.channels.get(seriesChannel);
    const channelVote = client.channels.get(voteChannel);

    const {
      name, body, imageURL, uploader, description, nsfw, is_western: western, is_game: game,
    } = req.body;

    if (!name || !imageURL || !uploader || !description || western == null || nsfw == null) {
      channelVote.send(`Could not upload series: ${name} from ${uploader}.`).catch((error) => logger.error(error));
      return res.sendStatus(400).send({ error: `Invalid series: ${JSON.stringify(req.body)}` });
    }

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
      .setTimestamp();

    if (!channel) return res.status(500).send('Channel not found.');

    const reactMessage = await channel.send(embed);

    const filter = (reaction, user) => (
      reaction.emoji.id === APPROVE
      || reaction.emoji.id === DENY
    ) && !user.bot;

    const collector = reactMessage.createReactionCollector(filter, { time: 60000000 });

    await reactMessage.react(APPROVE);
    await reactMessage.react(DENY);

    const collectorFunction = async (r) => {
      if (r == null || !r.emoji || !r.fetchUsers) return;

      await r.fetchUsers();
      const user = r.users.filter((u) => !u.bot).last();
      if (user == null) return;

      const member = await reactMessage.guild.fetchMember(user).catch(() => null);
      if (!member.roles.get(reviewer)) return;

      switch (r.emoji.id) {
        case APPROVE:
          try {
            const { status, data } = await bongoBotAPI.post('/series', req.body);
            const uploadUser = await client.fetchUser(uploader);

            const seriesEmbed = new RichEmbed()
              .setTitle(name)
              .setImage(data.url)
              .setURL(data.url)
              .setDescription(`${((western) ? 'WESTERN' : 'ANIME')} - ${((nsfw) ? 'NSFW' : 'SFW')}\n${body}\n\n${description}`)
              .setFooter(`${member.tag} (${member.id})`, member.displayAvatarURL)
              .setTimestamp();
            await reactMessage.edit('', { embed: seriesEmbed });

            uploadUser.send(`\`✅\` | Thanks for uploading the series **${name}**!`);
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        case DENY:
          try {
            await reactMessage.delete();
            logger.info(`Deleted ${name}, ${imageURL}`);

            const uploadUser = await client.fetchUser(uploader);
            uploadUser.send(`\`❌\` | Sorry, your submitted series **${name}** has been denied. You can still make a custom waifu and add it to its own series using the \`customwaifu\` command.`);
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        default:
          break;
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
