const logger = require('./../../infrastructure/logger');
const servicesStorage = require('./data/servicesStorage');

const isUuid = value => value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const extractPageNumber = (req) => {
  if (!req.query || req.query.page === undefined) {
    return 1;
  }

  const pageNumber = parseInt(req.query.page);
  return isNaN(pageNumber) ? 0 : pageNumber;
};
const extractPageSize = (req) => {
  if (!req.query || req.query.pageSize === undefined) {
    return 25;
  }

  const pageSize = parseInt(req.query.pageSize);
  return isNaN(pageSize) ? 0 : pageSize;
};

const getServiceUsers = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';

  if (!isUuid(serviceId)) {
    res.status(404).send();
    return;
  }

  try {
    const service = await servicesStorage.getById(serviceId, req.header('x-correlation-id'));
    if (!service) {
      res.status(404).send();
      return;
    }

    const pageNumber = extractPageNumber(req);
    if (pageNumber < 1) {
      res.status(400).send('page must be greater than 0');
      return;
    }

    const pageSize = extractPageSize(req);
    if (pageSize < 1) {
      res.status(400).send('pageSize must be greater than 0');
      return;
    } else if (pageSize > 1000) {
      res.status(400).send('pageSize must not be greater than 1000');
      return;
    }

    let userIds;
    if (req.body && req.body.userIds)
      userIds = req.body.userIds;

    const usersOfService = await servicesStorage.getAllUsersOfService(serviceId, userIds, pageNumber, pageSize, req.header('x-correlation-id'));

    res.status(200).send(usersOfService);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getServiceUsers;
