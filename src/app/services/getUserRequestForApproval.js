const logger = require('./../../infrastructure/logger');
const servicesStorage = require('./data/servicesStorage');

const action = async (req, res) => {
  try {
    if (!req.params.sid || !req.params.org_id || !req.params.uid) {
      res.status(400).send();
      return;
    }

    const services = await servicesStorage.getUserService(req.params.sid, req.params.org_id, req.params.uid);

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
