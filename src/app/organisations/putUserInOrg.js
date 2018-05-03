const { setUserAccessToOrganisation } = require('./data/organisationsStorage');

const putUserInOrg = async (req, res) => {
  const organisationId = req.params.id;
  const userId = req.params.uid;
  const roleId = req.body.roleId || 0;

  const created = await setUserAccessToOrganisation(organisationId, userId, roleId);

  return res.status(created ? 201 : 202).send();
};

module.exports = putUserInOrg;
