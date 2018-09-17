const { getOrgById } = require('./data/organisationsStorage');

const getOrganisation = async (req, res) => {
  const organisation = await getOrgById(req.params.id);
  if (!organisation) {
    return res.status(404).send();
  }
  return res.contentType('json').send(organisation);
};

module.exports = getOrganisation;
