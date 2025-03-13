const { getUsersByIds } = require("../../infrastructure/directories/api");
const {
  createUserOrgRequest,
  getApproversForOrg,
} = require("./data/organisationsStorage");

const createUserOrganisationRequest = async (req, res) => {
  if (!req.params.uid || !req.params.id) {
    return res.status(400).send();
  }

  let status = 0;
  const approverIds = await getApproversForOrg(req.params.id);
  if (approverIds && approverIds.length >= 1) {
    const users = await getUsersByIds(approverIds);
    const activeUsers = users.find((user) => user.status === 1);
    if (activeUsers.length === 0) {
      // Org has approvers but they're all deactivated.
      status = 3;
    }
  } else {
    // No approvers.
    status = 3;
  }

  const organisationRequest = {
    userId: req.params.uid,
    organisationId: req.params.id,
    reason: req.body.reason,
    status: status,
  };
  const request = await createUserOrgRequest(organisationRequest);
  return res.status(201).send(request);
};

module.exports = createUserOrganisationRequest;
