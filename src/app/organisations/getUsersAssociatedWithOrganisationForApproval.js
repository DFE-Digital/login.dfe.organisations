const logger = require("./../../infrastructure/logger");
const {
  getUsersPendingApprovalByUser,
  getUsersPendingApproval,
} = require("./data/organisationsStorage");

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
    if (req.params && req.params.uid) {
      const userId = req.params.uid.toLowerCase();
      const userOrganisations = await getUsersPendingApprovalByUser(userId);
      return res.contentType("json").send(userOrganisations);
    } else {
      const pageNumber = getPageNumber(req);
      const page = await getUsersPendingApproval(pageNumber, pageSize);
      return res.contentType("json").send({
        usersForApproval: page.usersForApproval,
        page: pageNumber,
        totalNumberOfPages: page.totalNumberOfPages,
        totalNumberOfRecords: page.totalNumberOfRecords,
      });
    }
  } catch (e) {
    logger.error(
      `Error getting user organisations for approval for user - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getUsersAssociatedWithOrganisation;
