const logger = require('./../../infrastructure/logger/index');
const ServicesStorage = require('./data/servicesStorage');

const action = async (req, res) => {

  try{
    if(!req.params.uid) {
      res.status(400).send();
      return;
    }

    const storage = new ServicesStorage();
    const services = storage.getUserUnassociatedServices(req.params.uid);

    if(!services){
      res.status(404);
      return;
    }
    res.status(200).send(services);
  } catch(e) {
    logger.error(e);
    res.status(500).send(e);
  }

};

module.exports = action;