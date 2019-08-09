const logger = require('./../../infrastructure/logger');
const { getApproversForOrg } = require('./data/organisationsStorage');

const getApproversForOrganisation = async (req, res) => {
  try {
    const usersForOrg = await getApproversForOrg(req.params.id);
    return res.status(200).send(usersForOrg);
  } catch (e) {
    logger.error(`Error getting approvers associated with organisation ${req.params.id} - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = getApproversForOrganisation;
