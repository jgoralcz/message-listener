const log4js = require('log4js');

const logger = log4js.getLogger();
const { bongoBotAPI } = require('../../services/bongo');
const { matchID } = require('../../util/constants/roles');
const { getPatronIDByName } = require('./patronByID');
const { config } = require('../../util/constants/paths');
const { PROD } = require('../../util/constants/environments');
const { PATRON_CHANNEL } = require('../../util/constants/channels');

// eslint-disable-next-line import/no-dynamic-require
const { owner } = require(config);

const thanks = (member, role) => `${member.toString()}, thank you for becoming a ${role} Patron! <:yayyy:594449175534632967>. To properly set you up, I will need you to use the \`@Bongo#3445 id\` command **IN YOUR SERVER** and **paste** the results here.`;
const setupMessage = (member) => `${member.toString()}, I have set your server up! You can now use the \`serversettings\` command to customize your perks. If I made a mistake please be sure to send a message in the official Bongo Support server https://discord.gg/dfajqcZ.\n**Please do not leave the server otherwise you may lose your perks automatically!**`;

const awaitUserMessage = async (client, newMember, patronType) => {
  console.log('await user message');
  const channel = client.channels.cache.get(PATRON_CHANNEL);
  const collector = channel.createMessageCollector((message) => {
    console.log('message', message);
    console.log(newMember.id);
    return message.author.id === newMember.id;
  });

  collector.on('collect', async (message) => {
    console.log('message', message);
    if (!message.content) return;

    const { content } = message;
    if (!content) return;

    const split = content.split(/\s+/);
    const verify = split.filter((ele) => ele.match(matchID));

    if (verify.length <= 0) return;
    const guildID = verify[0];

    try {
      const patronID = await getPatronIDByName(patronType);

      await bongoBotAPI.patch(`/patrons/users/${newMember.id}/guilds/${guildID}`, { patronID, guildID, type: patronType });

      if (process.env.NODE_ENV === PROD) {
        await channel.send(setupMessage(newMember)).catch((error) => logger.error(error));
      }

      collector.stop();
    } catch (error) {
      logger.error(error);
      logger.error(`Could not add ${newMember.id} - ${patronType}`);

      const ownerUser = await client.users.fetch(owner);
      ownerUser.send(`Could not add ${newMember.id} - ${patronType}`).catch((err) => logger.error(err));
    }
  });
};

const updateSuperBongo = async (client, member, patronType) => {
  const channel = client.channels.cache.get(PATRON_CHANNEL);
  try {
    const patronID = await getPatronIDByName(patronType);
    await bongoBotAPI.patch(`/patrons/users/${member.id}`, { patronID });

    logger.info(patronType, member.id, patronID, true);
  } catch (error) {
    logger.error(error);
    logger.error(`Could not add ${member.id} - ${patronType}`);

    const ownerUser = await client.users.fetch(owner);
    ownerUser.send(`Could not add ${member.id} - ${patronType}`).catch((err) => logger.error(err));
  }

  if (process.env.NODE_ENV !== PROD) return;

  await channel.send(`${member.toString()}, thank you for becoming a Super Bongo Patron! <:yayyy:594449175534632967> I have automatically set you up. If I made a mistake please send a message in the offical server.\n**Please do not leave the server otherwise you may lose your perks automatically!**`).catch((error) => logger.error(error));
};

const updateGuildPatron = async (client, member, patronType) => {
  logger.info(patronType, member.id, true);
  const channel = client.channels.cache.get(PATRON_CHANNEL);

  if (process.env.NODE_ENV !== PROD) return;

  await channel.send(thanks(member, patronType)).catch((error) => logger.error(error));

  console.log('before function');
  await awaitUserMessage(client, member, patronType);
};

module.exports = {
  updateSuperBongo,
  updateGuildPatron,
};
