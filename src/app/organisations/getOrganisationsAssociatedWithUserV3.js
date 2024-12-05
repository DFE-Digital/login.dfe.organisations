const logger = require("./../../infrastructure/logger");
const {
  getOrganisationsAssociatedToUser,
} = require("./data/organisationsStorage");

const getOrganisationsAssociatedWithUserV3 = async (req, res) => {
  try {
    const userOrganisations = await getOrganisationsAssociatedToUser(
      req.params.uid,
      true,
    );
    return res.contentType("json").send(userOrganisations);
  } catch (e) {
    logger.error(
      `Error getting organisations associated with user ${req.params.uid} (v2) - ${e.message}`,
    );
    return res.status(500).send();
  }
};

module.exports = getOrganisationsAssociatedWithUserV3;
