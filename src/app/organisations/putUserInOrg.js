const { setUserAccessToOrganisation } = require('./data/organisationsStorage');

const putUserInOrg = async (req, res) => {
  const organisationId = req.params.id;
  const userId = req.params.uid;
  const roleId = req.body.roleId || 0;
  const status = req.body.status || 0;
  const reason = req.body.reason;

  const created = await setUserAccessToOrganisation(organisationId, userId, roleId, status, reason);

  return res.status(created ? 201 : 202).send();
};

module.exports = putUserInOrg;
