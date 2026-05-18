const logger = require("../../infrastructure/logger");
const { getServiceRequestById } = require("./data/organisationsStorage");

const getServiceRequest = async (req, res) => {
  try {
    const request = await getServiceRequestById(req.params.rid);
    if (!request) {
      return res.status(404).send();
    }
    return res.status(200).send(request);
  } catch (e) {
    logger.error(
      `Error getting service request ${req.params.rid} - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getServiceRequest;
