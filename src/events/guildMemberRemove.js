const {
  superBongo, bongoNeko, smolNeko,
} = require('../lib/constants');

const { resetGuildLeaver, resetSuperBongo } = require('../lib/resetUsers');

const run = (client) => {
  client.on('guildMemberRemove', async (leftMember) => {
    if (leftMember._roles.includes(superBongo)) {
      return resetSuperBongo(leftMember);
    }

    if (leftMember._roles.includes(bongoNeko)) {
      return resetGuildLeaver(leftMember, 'Bongo Neko');
    }

    if (leftMember._roles.includes(smolNeko)) {
      return resetGuildLeaver(leftMember, 'Smol Neko');
    }

    return undefined;
  });
};

module.exports = run;
