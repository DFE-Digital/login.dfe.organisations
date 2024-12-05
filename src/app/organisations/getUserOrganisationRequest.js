const { getUserOrgRequestById } = require("./data/organisationsStorage");

const getUserOrganisationRequest = async (req, res) => {
  const request = await getUserOrgRequestById(req.params.rid);
  if (!request) {
    return res.status(404).send();
  }
  return res.status(200).send(request);
};

module.exports = getUserOrganisationRequest;
