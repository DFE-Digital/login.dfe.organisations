"use strict";

const logger = require("./../../infrastructure/logger");
const servicesStorage = require("./data/servicesStorage");

const getServiceById = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : "";

  try {
    const service = await servicesStorage.getById(
      serviceId,
      req.header("x-correlation-id"),
    );
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

module.exports = getServiceById;
