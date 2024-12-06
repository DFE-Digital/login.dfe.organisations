const logger = require("./../../infrastructure/logger");
const {
  getUsersAssociatedWithOrganisation,
} = require("./data/organisationsStorage");

const getUsersForOrganisation = async (req, res) => {
  try {
    const usersForOrg = await getUsersAssociatedWithOrganisation(req.params.id);
    return res.status(200).send(usersForOrg);
  } catch (e) {
    logger.error(
      `Error getting users associated with organisation ${req.params.id} - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getUsersForOrganisation;
