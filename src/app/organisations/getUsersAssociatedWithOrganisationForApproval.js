const logger = require('./../../infrastructure/logger');
const { getUsersAssociatedWithOrganisationForApproval } = require('./data/organisationsStorage');

const getUsersAssociatedWithOrganisation = async (req, res) => {
  try {
    const userId = req.params.uid.toLowerCase();

    const userOrganisations = await getUsersAssociatedWithOrganisationForApproval(userId);
    return res.contentType('json').send(userOrganisations);
  } catch (e) {
    logger.error(`Error getting user organisations for approval for user ${req.params.uid} - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getUsersAssociatedWithOrganisation;
