const {
  matchID, superBongo, bongoNeko,
  smolNeko, bongoDaddy,
} = require('../util/constants/roles');

const { resetGuildLeaver, resetSuperBongo } = require('../lib/resetUsers');

const {
  getPatronRoleID, insertPatron, updateGuildPatronOne,
  updateGuildPatronTwo, updatePatronUser,
} = require('../db/tables/patrons/patron_table');

const thanks = (role) => `Thank you for becoming a ${role} Patron! <:yayyy:594449175534632967>. To properly set you up, I will need you to use the \`@Bongo#3445 id\` command **IN YOUR SERVER** and **paste** the results here.`;
const setupMessage = 'I have set your server up! You can now use the `serversettings` command to customize your perks. If I made a mistake please be sure to send a message in the official Bongo Support server https://discord.gg/dfajqcZ.\n**Please do not leave the server otherwise you may lose your perks automatically!**';

const awaitUserMessage = async (newMember, updateGuildUserPatronFunction, updateGuildUserPatron, patronID) => {
  const channel = await newMember.createDM();
  const filter = (message) => message.author.id === newMember.id;
  const collector = channel.createMessageCollector(filter);

  collector.on('collect', async (message) => {
    if (!message.content) return;

    const { content } = message;
    if (!content) return;

    const split = content.split(/\s+/);
    const verify = split.filter((ele) => ele.match(matchID));

    if (verify.length <= 0) return;
    const guildID = verify[0];

    try {
      await updateGuildUserPatronFunction(newMember.id, patronID, guildID);
      await updateGuildUserPatron(guildID, true);
      await newMember.send(setupMessage).catch(console.error);
      collector.stop();
    } catch (error) {
      console.error(error);
    }
  });
};

const run = (client) => {
  // check for role updates.
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember._roles && newMember._roles.length
      && oldMember._roles.length === newMember._roles.length) return undefined;

    if (!oldMember._roles.includes(superBongo) && newMember._roles.includes(superBongo)) {
      const patronIDQuery = await getPatronRoleID('Super Bongo');
      const patronID = patronIDQuery[0].patron_id;

      if (!patronID) return undefined;

      await newMember.send('Thank you for becoming a Super Bongo Patron! <:yayyy:594449175534632967> I have automatically set you up. If I made a mistake please send a message in the offical server.\n**Please do not leave the server otherwise you may lose your perks automatically!**').catch(console.error);
      console.log('Super Bongo', newMember.id, patronID, true);

      await insertPatron(newMember.id, patronID, null);
      await updatePatronUser(newMember.id, true);
      return undefined;
    }

    if (!oldMember._roles.includes(bongoNeko) && newMember._roles.includes(bongoNeko)) {
      const patronIDQuery = await getPatronRoleID('Bongo Neko');
      const patronID = patronIDQuery[0].patron_id;

      if (!patronID) return undefined;
      console.log('Bongo Neko', newMember.id, patronID, true);

      await newMember.send(thanks('Bongo Neko')).catch(console.error);
      await awaitUserMessage(newMember, insertPatron, updateGuildPatronTwo, patronID);
      return undefined;
    }

    if (!oldMember._roles.includes(smolNeko) && newMember._roles.includes(smolNeko)) {
      const patronIDQuery = await getPatronRoleID('Smol Neko');
      const patronID = patronIDQuery[0].patron_id;

      if (!patronID) return undefined;
      console.log('Smol Neko', newMember.id, patronID, true);

      await newMember.send(thanks('Smol Neko')).catch(console.error);
      await awaitUserMessage(newMember, insertPatron, updateGuildPatronOne, patronID);
      return undefined;
    }

    if (!oldMember._roles.includes(bongoDaddy) && newMember._roles.includes(bongoDaddy)) {
      await oldMember.send('OwO I didn\'t expect anyone to be this nice! Please come tell me which Bongo Cat you want and which servers you want perks for (this is a manual process so it may take a bit).').catch(console.error);
      return undefined;
    }


    if (oldMember._roles.includes(superBongo) && !newMember._roles.includes(superBongo)) {
      return resetSuperBongo(newMember);
    }

    if (oldMember._roles.includes(bongoNeko) && !newMember._roles.includes(bongoNeko)) {
      return resetGuildLeaver(newMember, 'Bongo Neko');
    }

    if (oldMember._roles.includes(smolNeko) && !newMember._roles.includes(smolNeko)) {
      return resetGuildLeaver(newMember, 'Smol Neko');
    }
    return undefined;
  });
};

module.exports = run;
