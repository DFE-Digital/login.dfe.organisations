const { setUserAccessToOrganisation } = require("./data/organisationsStorage");
const { raiseNotificationThatUserHasChanged } = require("./notifications");
const { getUserOrganisationIdentifiers } = require("./utils");

const putUserInOrg = async (req, res) => {
  const organisationId = req.params.id;
  const userId = req.params.uid;
  const roleId = req.body.roleId || 0;
  const status = req.body.status || 0;
  const reason = req.body.reason;
  const { numericIdentifier, textIdentifier } =
    await getUserOrganisationIdentifiers(
      userId,
      organisationId,
      req.body.numericIdentifier,
      req.body.textIdentifier,
    );

  const created = await setUserAccessToOrganisation(
    organisationId,
    userId,
    roleId,
    status,
    reason,
    numericIdentifier,
    textIdentifier,
  );

  await raiseNotificationThatUserHasChanged(userId);

  return res.status(created ? 201 : 202).send();
};

module.exports = putUserInOrg;
