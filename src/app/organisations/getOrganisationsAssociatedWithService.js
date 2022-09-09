const logger = require('./../../infrastructure/logger');
const servicesStorage = require('../../../src/app/services/data/servicesStorage');

const organisationsStorage = require('./data/organisationsStorage');

const isUuid = value => value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const extractPageNumber = (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  if (!paramsSource || paramsSource.page === undefined) {
    return 1;
  }

  const pageNumber = parseInt(paramsSource.page);
  return isNaN(pageNumber) ? 0 : pageNumber;
};
const extractPageSize = (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  if (!paramsSource || paramsSource.pageSize === undefined) {
    return 25;
  }

  const pageSize = parseInt(paramsSource.pageSize);
  return isNaN(pageSize) ? 0 : pageSize;
};

const getOrganisationsAssociatedWithService = async(req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';
  const criteria = req.query.search;
  const sortBy = req.query.sortBy;
  const sortDirection = req.query.sortDirection;

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
    } else if (pageSize > 50) {
      res.status(400).send('pageSize must not be greater than 50');
      return;
    }

    const pagedResult = await organisationsStorage.getOrganisationsAssociatedToService(serviceId, criteria, pageNumber, pageSize, sortBy, sortDirection, req.header('x-correlation-id'));

    res.status(200).send(pagedResult);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getOrganisationsAssociatedWithService;
