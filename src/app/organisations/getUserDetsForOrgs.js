const logger = require('./../../infrastructure/logger');
const { getUsersdetsAssociatedWithOrganisation } = require('./data/organisationsStorage');

const getUserDetsForOrgs = async (req, res) => {
  try {
    
    const usersForOrg = await getUsersdetsAssociatedWithOrganisation(req.params.id, req.query.pageNumber, req.query.sortColum, req.query.order, req.query.pageSize);
    return res.status(200).send(usersForOrg);
  } catch (e) {
    logger.error(`Error getting users associated with organisation ${req.params.id} - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getUserDetsForOrgs;
