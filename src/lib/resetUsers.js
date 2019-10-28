const {
  getPatronRoleID, getPatronRolesUserID, resetGuildPatron,
  removePatron, resetSuperBongoPatron,
} = require('../db/tables/patrons/patron_table');

const thanksGoodbye = (role) => `Thanks for being a ${role} patron! Every bit of support helps keep me alive and allows me to create new things for everyone! Unfortunately, you no longer have your perks.\n\n This process is automatic. If you believe there is a mistake please ask in the official support server https://discord.gg/dfajqcZ.`;

const resetGuildHelper = async (leftMember, patronID) => {
  const rows = await getPatronRolesUserID(leftMember.id);
  if (!rows) return;

  for (let i = 0; i < rows.length; i += 1) {
    const guildID = rows[i].guild_id;
    await resetGuildPatron(guildID);
  }

  await removePatron(leftMember.id, patronID);

};

const resetSuperBongo = async (leftMember, patronType = 'Super Bongo') => {
  const patronIDQuery = await getPatronRoleID(patronType);
  const patronID = patronIDQuery[0].patron_id;

  if (!patronID) return;
  console.log(patronType, leftMember.id, patronID, false);

  await leftMember.send(thanksGoodbye(patronType)).catch(console.error);

  await removePatron(leftMember.id, patronID);
  await resetSuperBongoPatron(leftMember.id);
};

const resetGuildLeaver = async (leftMember, patronType) => {
  const patronIDQuery = await getPatronRoleID(patronType);
  const patronID = patronIDQuery[0].patron_id;

  if (!patronID) return undefined;
  console.log(patronType, leftMember.id, patronID, false);

  await leftMember.send(thanksGoodbye(patronType)).catch(console.error);
  return resetGuildHelper(leftMember, patronID);
};

module.exports = {
  resetSuperBongo,
  resetGuildLeaver,
};
