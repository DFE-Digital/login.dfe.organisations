const uuid = require('uuid/v4');
const { upsertServiceUser } = require('./../services/data/servicesStorage');
const { getOrgByUrn, getOrgByUid } = require('./../services/data/organisationsStorage');

const action = async (req, res) => {
  if (!req.params.uid || !req.params.sid || !req.params.ext_org_id || !req.body.org_type) {
    return res.status(403).send();
  }

  let organisationId;
  if (req.body.org_type === '010' || req.body.org_type === '013') {
    const org = await getOrgByUid(req.params.ext_org_id);
    organisationId = org.id;
    if (org) {
      organisationId = org.id.toLowerCase();
    }
  } else if (req.body.org_type === '001') {
    const org = await getOrgByUrn(req.params.ext_org_id);
    if (org) {
      organisationId = org.id.toLowerCase();
    }
  }

  if (!organisationId) {
    return res.status(403).send();
  }

  const status = req.body.status || 1;
  const roleId = req.body.roleId || 0;


  await upsertServiceUser({
    id: uuid(),
    userId: req.params.uid.toLowerCase(),
    organisationId,
    serviceId: req.params.sid.toLowerCase(),
    roleId,
    status,
  });

  return res.status(202).send();
};

module.exports = action;
