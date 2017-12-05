const logger = require('./../../infrastructure/logger');
const servicesStorage = require('./data/servicesStorage');

const isUuid = value => value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const getApproversOfService = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';
  const organisationId = req.params.org_id ? req.params.org_id.toLowerCase() : '';

  if (!isUuid(serviceId) || !isUuid(organisationId)) {
    res.status(404).send();
    return;
  }

  try {
    const service = await servicesStorage.getById(serviceId);
    if (!service) {
      res.status(404).send();
      return;
    }

    const usersOfService = await servicesStorage.getApproversOfServiceUserIds(organisationId, serviceId);

    res.status(200).send(usersOfService);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getApproversOfService;
