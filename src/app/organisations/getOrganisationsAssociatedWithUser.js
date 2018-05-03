const logger = require('./../../infrastructure/logger');
const { getOrganisationsForUser } = require('./data/organisationsStorage');

const getOrganisationsAssociatedWithUser = async (req, res) => {
  try {
    const userOrganisations = await getOrganisationsForUser(req.params.uid);
    return res.contentType('json').send(userOrganisations);
  } catch (e) {
    logger.error(`Error getting organisations associated with user ${req.params.uid} - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getOrganisationsAssociatedWithUser;
