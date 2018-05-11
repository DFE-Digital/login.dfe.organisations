const { getOrganisationStates } = require('./data/organisationsStorage');

const listCategories = async (req, res) => {
  const states = await getOrganisationStates();
  return res.contentType('json').send(states);
};

module.exports = listCategories;
