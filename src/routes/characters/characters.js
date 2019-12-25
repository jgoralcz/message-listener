const { RichEmbed } = require('discord.js');
const route = require('express-promise-router')();
const log4js = require('log4js');

const logger = log4js.getLogger();

const client = require('../../index');
const { bongoBotAPI } = require('../../services/bongo');
const { characterChannel, voteChannel } = require('../../../config.json');
const { reviewer } = require('../../util/constants/roles');

const { APPROVE, DENY } = require('../../util/constants/emojis');

route.post('/', async (req, res) => {
  try {
    const channel = client.channels.get(characterChannel);
    const channelVote = client.channels.get(voteChannel);

    if (!req.body.character) {
      return res.sendStatus(400);
    }
    const {
      name, series, body, imageURL, uploader, description, husbando, unknownGender, nsfw,
    } = req.body.character;

    if (!name || !series || !imageURL || !uploader || !description || husbando == null || unknownGender == null || nsfw == null) {
      channelVote.send(`Could not upload character: ${name}, ${series} from ${uploader}.`).catch((error) => logger.error(error));
      return res.sendStatus(400);
    }

    const embed = new RichEmbed()
      .setTitle(name)
      .setImage(imageURL)
      .setURL(imageURL)
      .setDescription(`${series} - ${((nsfw) ? 'nsfw' : 'sfw').toUpperCase()}\n${body}`)
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
            await bongoBotAPI.post('/characters', req.body.character).catch((error) => logger.error(error));
            const uploadUser = await client.fetchUser(uploader);

            uploadUser.send(`\`✅\` | Thanks for uploading **${name}** from **${series}**!`);
          } catch (error) {
            logger.error(error);
          }
          collector.stop();
          break;

        case DENY:
          try {
            await reactMessage.delete();
            logger.info(`Deleted ${name}, ${series}, ${imageURL}`);

            const uploadUser = await client.fetchUser(uploader);
            uploadUser.send(`\`❌\` | Sorry, **${name}** from **${series}** has been denied. You can still make a custom waifu out of them using the \`customwaifu\` command.`);
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
