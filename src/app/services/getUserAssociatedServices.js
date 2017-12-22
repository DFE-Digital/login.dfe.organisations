const logger = require('./../../infrastructure/logger');
const servicesStorage = require('./data/servicesStorage');

const getUserAssociatedServices = async (req, res) => {
  try {
    if (!req.params.uid) {
      res.status(400).send();
      return;
    }

    const services = await servicesStorage.getUserAssociatedServices(req.params.uid, req.header('x-correlation-id'));

    if (!services) {
      res.status(200).send([]);
      return;
    }
    res.status(200).send(services);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getUserAssociatedServices;
