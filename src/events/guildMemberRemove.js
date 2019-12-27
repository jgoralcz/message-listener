const {
  superBongo, bongoNeko, smolNeko,
} = require('../util/constants/roles');

const { resetGuildLeaver, resetSuperBongo } = require('../lib');

const run = (client) => {
  client.on('guildMemberRemove', async (leftMember) => {
    if (leftMember.roles.get(superBongo)) {
      return resetSuperBongo(client, leftMember, 'Super Bongo');
    }

    if (leftMember.roles.get(bongoNeko)) {
      return resetGuildLeaver(client, leftMember, 'Bongo Neko');
    }

    if (leftMember.roles.get(smolNeko)) {
      return resetGuildLeaver(client, leftMember, 'Smol Neko');
    }

    return undefined;
  });
};

module.exports = run;
