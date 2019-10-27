const { poolQuery } = require('../../index');

const getPatronRoleID = async (patronName) => poolQuery(`
  SELECT patron_id
  FROM patron_ranks
  WHERE patron_name ILIKE $1;
`, [patronName]);

const getPatronRolesUserID = async (userID) => poolQuery(`
  SELECT patron_name, 
  FROM (
    SELECT patron_id
    FROM patron_table
    WHERE user_id = $1
  ) pt
  JOIN patron_ranks pr ON pr.patron_id = pt.patron_id;
`, [userID]);

const insertPatron = async (userID, guildID) => poolQuery(`
  INSERT INTO patron_table (user_id, guild_id, patron_id)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id, guild_id, patron_id) DO NOTHING;
`, [userID, guildID, patronID, category, redditID]);

const removePatron = async (userID, patronID) => poolQuery(`
  DELETE
  FROM patron_table
  WHERE user_id = $1 AND patron_id = $2;
`, [userID, patronID]);


module.exports = {
  insertPatron,
  removePatron,
  getPatronRoleID,
  getPatronRolesUserID,
};
