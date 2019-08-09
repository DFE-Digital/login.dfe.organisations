const { createUserOrgRequest } = require('./data/organisationsStorage');

const createUserOrganisationRequest = async (req, res) => {
  if (!req.params.uid || !req.params.id) {
    return res.status(400).send();
  }
  const organisationRequest = {
    userId: req.params.uid,
    organisationId: req.params.id,
    reason: req.body.reason,
  };
  const request = await createUserOrgRequest(organisationRequest);
  return res.status(201).send(request);
};

module.exports = createUserOrganisationRequest;
