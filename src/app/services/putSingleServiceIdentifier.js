const { upsertExternalIdentifier, getExternalIdentifier } = require('./data/servicesStorage');


const putSingleServiceIdentifierForUser = async (req, res) => {

  const orgId = req.params.org_id ? req.params.org_id.toLowerCase() : '';
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : '';
  const userId = req.params.uid ? req.params.uid.toLowerCase() : '';
  const identifierKey = req.body.id_key ? req.body.id_key.toLowerCase() : '';
  const identifierValue = req.body.id_value ? req.body.id_value.toLowerCase() : '';

  if(!identifierKey) {
    return res.status(403).send();
  }

  const checkExternalIdentifier = await getExternalIdentifier(serviceId, identifierKey, identifierValue, req.header('x-correlation-id'));

  if(checkExternalIdentifier) {
    return res.status(409).send();
  }

  await upsertExternalIdentifier(serviceId, userId, orgId, identifierKey, identifierValue, req.header('x-correlation-id'));

  return res.status(202).send();
};

module.exports = putSingleServiceIdentifierForUser;
