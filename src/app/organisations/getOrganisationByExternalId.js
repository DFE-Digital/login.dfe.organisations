const { getOrgByUrn, getOrgByUid } = require('./data/organisationsStorage');

const getOrganisationByExternalIdentifier = async (req, res) => {
  if (!req.params.id || !req.params.type) {
    return res.status(403).send();
  }

  let org;
  if (req.params.type === '010' || req.params.type === '013') {
    org = await getOrgByUid(req.params.id);
  } else if (req.params.type === '001') {
    org = await getOrgByUrn(req.params.id);
  }
  if (org) {
    return res.contentType('json').send(org);
  }
  return res.status(404).send();
};

module.exports = getOrganisationByExternalIdentifier;