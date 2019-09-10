const logger = require('./../../infrastructure/logger');
const { getRequestsAssociatedWithUser } = require('./data/organisationsStorage');

const getPendingRequestsAssociatedWithUser = async (req, res) => {
  try {
    const requestsForUser = await getRequestsAssociatedWithUser(req.params.uid);
    return res.status(200).send(requestsForUser);
  } catch (e) {
    logger.error(`Error getting requests for user ${req.params.uid} - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getPendingRequestsAssociatedWithUser;

