const logger = require('./../../infrastructure/logger');
const organisationsStorage = require('./data/organisationsStorage');

const uuidRegex = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/;
const isUuid = value => uuidRegex.test(value);

const extractNumber = (req, key, defaultValue) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  if (!paramsSource || paramsSource[key] === undefined) return defaultValue;

  const num = parseInt(paramsSource[key], 10);
  return isNaN(num) ? 0 : num;
};

function fixMultiSelect(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value) {
    return [value];
  }
  return [];
}

const getOrganisationsAssociatedWithService = async(req, res) => {
  const serviceId = (req.params.sid || '').toLowerCase();
  if (!isUuid(serviceId)) return res.status(404).send('Invalid service ID');

  try {
    const pageNumber = extractNumber(req, 'page', 1);
    if (pageNumber < 1) return res.status(400).send('Page number must be greater than 0');

    const pageSize = extractNumber(req, 'pageSize', 25);
    if (pageSize < 1 || pageSize > 50) return res.status(400).send('Page size must be between 1 and 50 inclusive');

    const filterCategories = fixMultiSelect(req.query.filtercategory);
    const filterStates = fixMultiSelect(req.query.filterstatus);

    const pagedResult = await organisationsStorage.getOrganisationsAssociatedToService(
      serviceId,
      req.query.search,
      pageNumber,
      pageSize,
      req.query.sortBy,
      req.query.sortDirection,
      filterCategories,
      filterStates
    );

    return res.status(200).send(pagedResult);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e.message || 'Server error');
  }
};

module.exports = getOrganisationsAssociatedWithService;
