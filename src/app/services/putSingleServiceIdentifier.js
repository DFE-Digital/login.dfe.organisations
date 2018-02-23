const { upsertExternalIdentifier } = require('./data/servicesStorage');


const putSingleServiceIdentifierForUser = async (req, res) => {

  const orgId = req.params.org_id ? req.params.org_id.toLowerCase() : '';
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';
  const userId = req.params.uid ? req.params.uid.toLowerCase() : '';
  const identifierKey = req.body.idKey ? req.body.idKey.toLowerCase() : undefined;
  const identifierValue = req.body.idValue ? req.body.idValue.toLowerCase() : '';

  if(!identifierKey) {
    return res.status(403).send();
  }

  await upsertExternalIdentifier(serviceId, userId, orgId, identifierKey, identifierValue, req.header('x-correlation-id'));

  return res.status(202).send();
};

module.exports = putSingleServiceIdentifierForUser;
