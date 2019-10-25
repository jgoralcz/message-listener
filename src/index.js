const Discord = require('discord.js');
const client = new Discord.Client();
const { token } = require('../config.json');

const matchID = /\d{15,30}/;
const superBongo = '546465605398560770';
const bongoNeko = '591155600650666005';
const smolNeko = '546430177706770455';
const bongoDaddy = '593188921421332480';
const thanks = (role) => `Thank you for becoming a ${role} Patron! <:yayyy:594449175534632967>. To properly set you up, I will need you to use the \`b.id\` command **IN YOUR SERVER** and **paste** the results here.`;

// check for role updates.
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (oldMember._roles && newMember._roles.length && oldMember._roles.length === newMember._roles.length) return;

  // adding
  if (!oldMember._roles.includes(superBongo) && newMember._roles.includes(superBongo)) {
    await oldMember.send('Thank you for becoming a Super Bongo Patron! <:yayyy:594449175534632967> I have automatically set you up. If I made a mistake please send a message in the offical server.').catch(console.error);
    return;
  }

  if (!oldMember._roles.includes(bongoNeko) && newMember._roles.includes(bongoNeko)) {
    await newMember.send(thanks('Bongo Neko')).catch(console.error);
    await awaitUserMessage(newMember, query, query);
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


client.on('ready', async () => {
  // console.log(await client.generateInvite());
  await client.user.setStatus('invisible');
  console.log(`Logged in as ${client.user.tag}.`);
  // require('./server.js');
});

client.login(token).catch(console.error);

module.exports = client;


const awaitUserMessage = async (newMember, updateGuildPatronFunction, updateUserGuildPatronFunction) => {
  const channel = await newMember.createDM();
  const filter = message => message.author.id === newMember.id;
  const collector = channel.createMessageCollector(filter);

  collector.on('collect', async message => {
    if (!message.content) return;

    const { content = ''} = message;
    const split = content.split(' ');
    const verify = split.filter( ele => ele.match(matchID));

    if (verify.length <= 0) return;

    const ID = verify[verify.length - 1];

    try {
      await updateGuildPatronFunction(newMember.id, ID);
      await updateUserGuildPatronFunction(newMember.id, ID);
      await newMember.send('I have set you up! You can now use the `serversettings` command to customize your perks. If I made a mistake please be sure to send a message in the official Bongo Support server.').catch(console.error);
      collector.stop();
    } catch (error) {
      console.error(error);
    }
  });
}