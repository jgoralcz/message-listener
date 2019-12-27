const { resetSuperBongo, resetGuildLeaver } = require('./patrons/resetPatrons');
const { updateSuperBongo, updateGuildPatron } = require('./patrons/updatePatrons');
const { getPatronIDByName } = require('./patrons/patronByID');

module.exports = {
  resetSuperBongo,
  resetGuildLeaver,
  updateSuperBongo,
  updateGuildPatron,
  getPatronIDByName,
};
