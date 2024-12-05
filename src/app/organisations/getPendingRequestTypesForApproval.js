const logger = require("./../../infrastructure/logger");
const {
  getAllPendingRequestTypesForApprover,
} = require("./data/organisationsStorage");
const getPendingRequestTypesForApproval = async (req, res) => {
  try {
    if (req.query != undefined) {
      const requestsForUser = await getAllPendingRequestTypesForApprover(
        req.params.uid,
        req.query.pageNumber,
        req.query.pageSize,
      );
      return res.status(200).send(requestsForUser);
    } else {
      const requestsForUser = await getAllPendingRequestTypesForApprover(
        req.params.uid,
      );
      return res.status(200).send(requestsForUser);
    }
  } catch (e) {
    logger.error(
      `Error getting requests for user ${req.params.uid} - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getPendingRequestTypesForApproval;
