'use strict';

const logger = require('./../../infrastructure/logger');
const ServicesStorage = require('./data/servicesStorage');

const getServiceDetails = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';

  try {
    const storage = new ServicesStorage();

    const service = await storage.getById(serviceId);
    if (!service) {
      res.status(404).send();
      return;
    }

    res.status(200).send(service);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getServiceDetails;