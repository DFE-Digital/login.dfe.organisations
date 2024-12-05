const logger = require("./../../infrastructure/logger");
const {
  getLatestActionedRequestAssociated,
} = require("./data/organisationsStorage");

const getLatestActionedRequestAssociatedWithUser = async (req, res) => {
  try {
    const request = await getLatestActionedRequestAssociated(req.params.uid);
    return res.status(200).send(request);
  } catch (e) {
    logger.error(
      `Error getting requests for user ${req.params.uid} - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getLatestActionedRequestAssociatedWithUser;
