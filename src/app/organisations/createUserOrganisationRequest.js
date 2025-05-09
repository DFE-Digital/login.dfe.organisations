const { getUsersRaw } = require("login.dfe.api-client/users");
const {
  createUserOrgRequest,
  getApproversForOrg,
} = require("./data/organisationsStorage");
const logger = require("../../infrastructure/logger");

const createUserOrganisationRequest = async (req, res) => {
  if (!req.params.uid || !req.params.id) {
    return res.status(400).send();
  }

  let status = 0;
  const approverIds = await getApproversForOrg(req.params.id);
  if (approverIds && approverIds.length >= 1) {
    const users = await getUsersRaw({ by: { userIds: approverIds.join(",") } });
    const activeUsers = users.filter((user) => user.status === 1);
    if (activeUsers.length === 0) {
      logger.info(
        `Organisation [${req.params.id}] has no active approvers.  Setting request status to 3`,
      );
      status = 3;
    }
  } else {
    logger.info(
      `Organisation [${req.params.id}] has no approvers.  Setting request status to 3`,
    );
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
