const { Pool } = require('pg');

const {
  db: {
    user, host, database, password, port, max, connectionTimeoutMillis, idleTimeoutMillis,
  },
} = require('../../config.json');

const pool = new Pool({
  user,
  host,
  database,
  password,
  port,
  max,
  connectionTimeoutMillis,
  idleTimeoutMillis,
});

/**
 * pool query function
 * @param {string} query the query to use against
 * @param {array<string>} paramsArray
 * @returns {Promise<*>}
 */
const poolQuery = async (query, paramsArray) => {
  const client = await pool.connect();
  try {
    const query = await client.query(query, paramsArray);
 
    if (!query || !query.rows || !query.rows.length <= 0) return undefined;
    return query.rows;

  } finally {
    client.release();
  }
};

module.exports = {
  poolQuery,
};
