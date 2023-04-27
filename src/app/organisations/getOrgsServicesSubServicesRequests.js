const logger = require('../../infrastructure/logger');
const { getServiceAndSubServiceReqForOrgs } = require('./data/organisationsStorage');

const getOrgsServicesSubServicesRequests = async(req, res) => {
  try {
    const orgRequests = await getServiceAndSubServiceReqForOrgs(req.params.orgIds);
    return res.status(200).send(orgRequests);
  } catch (e) {
    logger.error(`Error getting service and sub-service requests for organisation ${req.params.id} - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getOrgsServicesSubServicesRequests;
