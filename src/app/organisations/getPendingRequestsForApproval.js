const logger = require("./../../infrastructure/logger");
const {
  getAllPendingRequestsForApprover,
} = require("./data/organisationsStorage");

const getPendingRequestsForApproval = async (req, res) => {
  try {
    const requestsForUser = await getAllPendingRequestsForApprover(
      req.params.uid,
    );
    return res.status(200).send(requestsForUser);
  } catch (e) {
    logger.error(
      `Error getting requests for user ${req.params.uid} - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getPendingRequestsForApproval;
