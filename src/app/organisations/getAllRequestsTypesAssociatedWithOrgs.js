const logger = require('../../infrastructure/logger');
const {
  pagedListOfAllRequestTypesForOrg
} = require('./data/organisationsStorage');

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

const getAllRequestsTypesAssociatedWithOrgs = async(req, res) => {
  const pageNumber = extractPageNumber(req);
  if (pageNumber < 1) {
    return res.status(400).send('Page must be greater than 0');
  }

  const pageSize = extractPageSize(req);
  if (pageSize < 1) {
    return res.status(400).send('pageSize must be greater than 0');
  } else if (pageSize > 500) {
    return res.status(400).send('pageSize must not be greater than 500');
  }
  try {
    const orgRequests = await pagedListOfAllRequestTypesForOrg(
      req.params.orgIds, pageNumber, pageSize
    );
    return res.status(200).send(orgRequests);
  } catch (e) {
    logger.error(`Error getting organisation, service and sub-service access requests for organisation ${req.params.id} - ${e.message}`
    );
    return res.status(500).send();
  }
};

module.exports = getAllRequestsTypesAssociatedWithOrgs;
