const logger = require('./../../infrastructure/logger');
const ServicesStorage = require('./data/servicesStorage');

const action = async (req, res) => {
  try {
    if (!req.params.usid) {
      res.status(400).send();
      return;
    }

    const storage = new ServicesStorage();
    const services = await storage.getUserServiceById(req.params.usid);

    if (!services) {
      res.status(404).send();
      return;
    }
    res.status(200).send(services);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = action;
