const {
  getPatronRoleID, getPatronRolesUserID, resetGuildPatron,
  removePatron, updatePatronUser, resetSuperBongoPatron,
} = require('../db/tables/patrons/patron_table');

const thanksGoodbye = (role) => `Thanks for being a ${role} patron! Every bit of support helps keep me alive and allows me to create new things for everyone! Unfortunately, you no longer have your perks.\n\n This process is automatic. If you believe there is a mistake please ask in the official support server https://discord.gg/dfajqcZ.`;

const resetGuildHelper = async (leftMember, patronID) => {
  const rows = await getPatronRolesUserID(leftMember.id);
  await removePatron(leftMember.id, patronID);

  for (let i = 0; i < rows.lengh; i += 1) {
    const guildID = rows[i].guildId;
    await resetGuildPatron(guildID, false);
  }
};

const resetSuperBongo = async (leftMember) => {
  const patronIDQuery = await getPatronRoleID('Super Bongo');
  const patronID = patronIDQuery[0].patron_id;

  if (!patronID) return;
  console.log('Super Bongo', leftMember.id, patronID, false);

  await leftMember.send(thanksGoodbye('Super Bongo')).catch(console.error);

  await removePatron(leftMember.id, patronID);
  await resetSuperBongoPatron(leftMember.id);
};

const resetGuildLeaver = async (leftMember, patronType) => {
  const patronIDQuery = await getPatronRoleID(patronType);
  const patronID = patronIDQuery[0].patron_id;

  if (!patronID) return undefined;
  console.log(patronType, leftMember.id, patronID, false);

  await leftMember.send(thanksGoodbye('Super Bongo')).catch(console.error);
  return resetGuildHelper(leftMember, patronID);
};

module.exports = {
  resetSuperBongo,
  resetGuildLeaver,
};
