const { setUserAccessToOrganisation } = require('./data/organisationsStorage');
const { raiseNotificationThatUserHasChanged } = require('./notifications');
const { getUserOrganisationIdentifiers } = require('./utils');
const logger = require('./../../infrastructure/logger');

const putUserInOrg = async (req, res) => {
  logger.info('DSI-2547 In user put api - starts');
  const organisationId = req.params.id;
  const userId = req.params.uid;
  const roleId = req.body.roleId || 0;
  const status = req.body.status || 0;
  const reason = req.body.reason;
  logger.info('DSI-2547 In user put api - 2');
  const { numericIdentifier, textIdentifier } = await getUserOrganisationIdentifiers(userId, organisationId, req.body.numericIdentifier, req.body.textIdentifier)
  logger.info('DSI-2547 In user put api - 3 after getUserOrganisationIdentifiers');
  const created = await setUserAccessToOrganisation(organisationId, userId, roleId, status, reason, numericIdentifier, textIdentifier);
  logger.info('DSI-2547 In user put api - 4 after setUserAccessToOrganisation');

  await raiseNotificationThatUserHasChanged(userId);
  logger.info('DSI-2547 In user put api - 5 after raiseNotificationThatUserHasChanged');

  return res.status(created ? 201 : 202).send();
};

module.exports = putUserInOrg;
