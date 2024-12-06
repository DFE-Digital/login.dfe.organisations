const { deleteInvitationOrganisation } = require("./data/invitationsStorage");

const deleteOrg = async (req, res) => {
  const organisationId = req.params.org_id;
  const invitationId = req.params.inv_id;

  await deleteInvitationOrganisation(
    organisationId,
    invitationId,
    req.get("x-correlation-id"),
  );
  return res.status(204).send();
};

module.exports = deleteOrg;
