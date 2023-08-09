const logger = require('./../../infrastructure/logger');
const servicesStorage = require('../../../src/app/services/data/servicesStorage');
const organisationsStorage = require('./data/organisationsStorage');

const isUuid = value => /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/.test(value);

const extractNumber = (req, key, defaultValue) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  if (!paramsSource || paramsSource[key] === undefined) return defaultValue;

  const num = parseInt(paramsSource[key]);
  return isNaN(num) ? 0 : num;
};

const getOrganisationsAssociatedWithService = async(req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';
  if (!isUuid(serviceId)) return res.status(404).send();

  try {
    const service = await servicesStorage.getById(serviceId, req.header('x-correlation-id'));
    if (!service) return res.status(404).send();

    const pageNumber = extractNumber(req, 'page', 1);
    const pageSize = extractNumber(req, 'pageSize', 25);

    if (pageNumber < 1) return res.status(400).send('page must be greater than 0');
    if (pageSize < 1 || pageSize > 50) return res.status(400).send('pageSize must be between 1 and 50 inclusive');

    const pagedResult = await organisationsStorage.getOrganisationsAssociatedToService(
      serviceId, req.query.search, pageNumber, pageSize,
      req.query.sortBy, req.query.sortDirection, req.header('x-correlation-id')
    );

    res.status(200).send(pagedResult);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getOrganisationsAssociatedWithService;
