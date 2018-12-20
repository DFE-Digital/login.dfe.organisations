const config = require('./../../infrastructure/config')();
const { setUserAccessToOrganisation, getUserOrganisationByTextIdentifier, getNextUserOrgNumericIdentifier } = require('./data/organisationsStorage');
const { raiseNotificationThatUserHasChanged } = require('./notifications');
const { encodeNumberToString } = require('./../../utils');

const putUserInOrg = async (req, res) => {
  const organisationId = req.params.id;
  const userId = req.params.uid;
  const roleId = req.body.roleId || 0;
  const status = req.body.status || 0;
  const reason = req.body.reason;
  let numericIdentifier = req.body.numericIdentifier;
  let textIdentifier = req.body.textIdentifier;

  if (!numericIdentifier && config.toggles && config.toggles.generateUserOrgIdentifiers) {
    numericIdentifier = await getNextUserOrgNumericIdentifier();
  }

  if (!textIdentifier && config.toggles && config.toggles.generateUserOrgIdentifiers) {
    const options = encodeNumberToString(numericIdentifier);
    let current;
    let index = 1;
    let inUse;
    while ((!current || inUse) && index <= 5) {
      current = options[`option${index}`];
      const exiting = await getUserOrganisationByTextIdentifier(current);
      inUse = exiting && !(exiting.user_id === userId && exiting.organisation_id === organisationId);
      index += 1;
    }
    if (inUse) {
      return res.status(500).send();
    }
    textIdentifier = current;
  }

  const created = await setUserAccessToOrganisation(organisationId, userId, roleId, status, reason, numericIdentifier, textIdentifier);

  await raiseNotificationThatUserHasChanged(userId);

  return res.status(created ? 201 : 202).send();
};

module.exports = putUserInOrg;
