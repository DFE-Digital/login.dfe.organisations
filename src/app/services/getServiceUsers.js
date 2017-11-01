const logger = require('./../../infrastructure/logger');
const ServicesStorage = require('./data/servicesStorage');

const isUuid = (value) => {
  return value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);
};

const getServiceUsers = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';
  if (!isUuid(serviceId)) {
    res.status(400).send();
    return;
  }

  try {
    const storage = new ServicesStorage();

    const service = await storage.getById(serviceId);
    if (!service) {
      res.status(404).send();
      return;
    }

    const usersOfService = await storage.getUsersOfService(serviceId);

    res.status(200).send(usersOfService);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getServiceUsers;