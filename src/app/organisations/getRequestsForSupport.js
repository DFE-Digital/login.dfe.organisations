const logger = require('./../../infrastructure/logger');
const { getAllRequestsEscalatedToSupport } = require('./data/organisationsStorage');

const getRequestsForSupport = async (req, res) => {
  try {
    const orgRequests = await getAllRequestsEscalatedToSupport(req.params.id);
    return res.status(200).send(orgRequests);
  } catch (e) {
    logger.error(`Error getting escalated requests for support user ${req.params.id} - ${e.message}`);
    return res.status(500).send();
    
  }
};

module.exports = getRequestsForSupport;
