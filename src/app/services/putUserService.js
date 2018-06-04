const { upsertUserService, upsertExternalIdentifier } = require('./data/servicesStorage');

const putUserService = async (req, res) => {
  const organisationId = req.params.org_id;
  const serviceId = req.params.sid;
  const userId = req.params.uid;
  const status = req.body.status === undefined ? 1 : req.body.status;
  const externalIdentifiers = req.body.externalIdentifiers;
  const correlationId = req.header('x-correlation-id');

  await upsertUserService(organisationId, serviceId, userId, status, correlationId);
  if (externalIdentifiers) {
    for (let i = 0; i < externalIdentifiers.length; i++) {
      const externalId = externalIdentifiers[i];
      await upsertExternalIdentifier(serviceId, userId, organisationId, externalId.key, externalId.value, correlationId);
    }
  }

  return res.status(202).send();
};

module.exports = putUserService;
