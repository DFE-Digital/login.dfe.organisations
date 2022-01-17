const logger = require('./../../infrastructure/logger');
const { getRequestsAssociatedWithOrganisation, getRequestsAssociatedWithOrganisations } = require('./data/organisationsStorage');

const getRequestsForOrganisation = async (req, res) => {
  try {
    const orgRequests = await getRequestsAssociatedWithOrganisation(req.params.id);
    return res.status(200).send(orgRequests);
  } catch (e) {
    logger.error(`Error getting requests for organisation ${req.params.id} - ${e.message}`);
    return res.status(500).send();
  }
};

const getRequestsForOrganisations = async (req, res) => {
  try {
    const orgRequests = await getRequestsAssociatedWithOrganisations(req.params.orgIds);
    return res.status(200).send(orgRequests);
  } catch (e) {
    logger.error(`Error getting requests for organisation ${req.params.id} - ${e.message}`);
    return res.status(500).send();
  }
};


module.exports = {
  getRequestsForOrganisation,
  getRequestsForOrganisations
}
