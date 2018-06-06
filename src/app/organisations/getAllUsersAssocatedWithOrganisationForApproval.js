const logger = require('./../../infrastructure/logger');
const { getUsersPendingApproval } = require('./data/organisationsStorage');

const pageSize = 25;

const getPageNumber = (req) => {
  if (!req.query.page) {
    return 1;
  }

  const page = parseInt(req.query.page);
  if (isNaN(page)) {
    return 1;
  }

  return page;
};

const getUsersAssociatedWithOrganisation = async (req, res) => {
  try {
    const pageNumber = getPageNumber(req);
    const userOrganisations = await getUsersPendingApproval(pageNumber, pageSize);
    return res.contentType('json').send(userOrganisations);
  } catch (e) {
    logger.error(`Error getting user organisations for approval - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getUsersAssociatedWithOrganisation;
