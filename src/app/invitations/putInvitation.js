const logger = require("./../../infrastructure/logger");
const uuid = require("uuid");
const invitationStorage = require("./data/invitationsStorage");

const action = async (req, res) => {
  try {
    logger.info(
      `putting invitation. Params = ${JSON.stringify(req.params)}. Body = ${JSON.stringify(req.body)}. CorrelationId = ${req.header("x-correlation-id")}`,
      { correlationId: req.header("x-correlation-id") },
    );

    const invitationId = req.params.inv_id;
    const organisationId = req.params.org_id;
    const serviceId = req.params.svc_id;
    const roleId = req.body.roleId;
    const externalIdentifiers = req.body.externalIdentifiers;

    await invitationStorage.upsert(
      {
        invitationId,
        organisationId,
        serviceId,
        roleId,
        externalIdentifiers,
      },
      req.header("x-correlation-id"),
    );

    res.status(202).send();
  } catch (e) {
    const id = uuid.v4();
    logger.error(`error putting invitation (eid: ${id}) - ${e.message}`);
    res.status(500).send(`An error occured (id: ${id})`);
  }
};

module.exports = action;
