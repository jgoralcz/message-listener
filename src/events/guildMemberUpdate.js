const { matchID, superBongo, bongoNeko, smolNeko,bongoDaddy } = require('../lib/constants');
const { getPatronRoleID, getPatronRolesUserID, insertPatron, removePatron } = require('../db/tables/patrons/patron_table');

const thanks = (role) => `Thank you for becoming a ${role} Patron! <:yayyy:594449175534632967>. To properly set you up, I will need you to use the \`b.id\` command **IN YOUR SERVER** and **paste** the results here.`;

const awaitUserMessage = async (newMember, updateGuildUserPatronFunction, patronID) => {
  const channel = await newMember.createDM();
  const filter = message => message.author.id === newMember.id;
  const collector = channel.createMessageCollector(filter);

  collector.on('collect', async message => {
    if (!message.content) return;

    const { content} = message;

    if (!content) return;

    const split = content.split(' ');
    const verify = split.filter( ele => ele.match(matchID));

    if (verify.length <= 0) return;

    const guildID = verify[verify.length - 1];

    try {
      await updateGuildUserPatronFunction(newMember.id, guildID, patronID);
      await newMember.send('I have set you up! You can now use the `serversettings` command to customize your perks. If I made a mistake please be sure to send a message in the official Bongo Support server.').catch(console.error);
      collector.stop();
    } catch (error) {
      console.error(error);
    }
  });
}

const run = client => {
  // check for role updates.
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember._roles && newMember._roles.length && oldMember._roles.length === newMember._roles.length) return;

    // adding
    if (!oldMember._roles.includes(superBongo) && newMember._roles.includes(superBongo)) {
      await oldMember.send('Thank you for becoming a Super Bongo Patron! <:yayyy:594449175534632967> I have automatically set you up. If I made a mistake please send a message in the offical server.').catch(console.error);
      return;
    }

    if (!oldMember._roles.includes(bongoNeko) && newMember._roles.includes(bongoNeko)) {
      const patronID = await getPatronRoleID('Bongo Neko');
      await newMember.send(thanks('Bongo Neko')).catch(console.error);
      await awaitUserMessage(newMember, insertPatron, patronID);
      return;
    }

    if (!oldMember._roles.includes(smolNeko) && newMember._roles.includes(smolNeko)) {
      await oldMember.send(thanks('Smol Neko')).catch(console.error);
      await awaitUserMessage(newMember, query, query);
      return;
    }

    if (!oldMember._roles.includes(bongoDaddy) && newMember._roles.includes(bongoDaddy)) {
      await oldMember.send('OwO. I didn\'t expect anyone to be this nice! Please come tell me which Bongo Cat you want and which servers you want perks for (this is a manual process so it may take a bit).').catch(console.error);
      return;
    }

    // removing
  });
}

module.exports = run;