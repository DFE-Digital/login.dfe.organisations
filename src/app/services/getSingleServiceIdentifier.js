"use strict";

const logger = require("./../../infrastructure/logger");
const servicesStorage = require("./data/servicesStorage");

const getSingleServiceIdentifier = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : "";
  const identifierKey = req.params.id_key
    ? req.params.id_key.toLowerCase()
    : "";
  const identifierValue = req.params.id_value
    ? req.params.id_value.toLowerCase()
    : "";

  try {
    const externalIdentifier = await servicesStorage.getExternalIdentifier(
      serviceId,
      identifierKey,
      identifierValue,
      req.header("x-correlation-id"),
    );
    if (!externalIdentifier) {
      res.status(404).send();
      return;
    }

    res.status(200).contentType("json").send(externalIdentifier);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getSingleServiceIdentifier;
