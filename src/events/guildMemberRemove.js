const {
  superBongo, bongoNeko, smolNeko,
} = require('../util/constants/roles');

const { resetGuildLeaver, resetSuperBongo } = require('../lib');

const run = (client) => {
  client.on('guildMemberRemove', async (leftMember) => {
    if (leftMember.roles.get(superBongo)) {
      return resetSuperBongo(leftMember, 'Super Bongo');
    }

    if (leftMember.roles.get(bongoNeko)) {
      return resetGuildLeaver(leftMember, 'Bongo Neko');
    }

    if (leftMember.roles.get(smolNeko)) {
      return resetGuildLeaver(leftMember, 'Smol Neko');
    }

    return undefined;
  });
};

module.exports = run;
