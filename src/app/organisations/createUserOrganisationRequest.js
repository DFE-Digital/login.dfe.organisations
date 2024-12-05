const {
  createUserOrgRequest,
  getApproversForOrg,
} = require("./data/organisationsStorage");

const createUserOrganisationRequest = async (req, res) => {
  if (!req.params.uid || !req.params.id) {
    return res.status(400).send();
  }

  const approvers = await getApproversForOrg(req.params.id);

  const organisationRequest = {
    userId: req.params.uid,
    organisationId: req.params.id,
    reason: req.body.reason,
    status: approvers && approvers.length === 0 ? 3 : 0,
  };
  const request = await createUserOrgRequest(organisationRequest);
  return res.status(201).send(request);
};

module.exports = createUserOrganisationRequest;
