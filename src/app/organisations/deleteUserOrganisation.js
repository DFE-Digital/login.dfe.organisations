const { deleteUserOrganisation } = require('./data/organisationsStorage');

const deleteOrg = async (req, res) => {
  const organisationId = req.params.id;
  const userId = req.params.uid;

  await deleteUserOrganisation(organisationId, userId);
  return res.status(204).send();
};

module.exports = deleteOrg;
