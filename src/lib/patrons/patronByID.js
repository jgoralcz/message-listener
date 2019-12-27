const { owner } = require('../../../config');
const { bongoBotAPI } = require('../../services/bongo');
const client = require('../../index');

const getPatronIDByName = async (roleName) => {
  if (!roleName) throw Error('Patron ID not found.');

  const { status, data } = await bongoBotAPI.get(`/patrons/id-by-name/${roleName}`);
  if (!data || status !== 200 || !data.patronID) {
    throw Error('Patron ID not found.');
  }
  return data.patronID;
};

module.exports = {
  getPatronIDByName,
};
