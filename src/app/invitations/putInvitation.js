'use strict';

const logger = require('./../../infrastructure/logger');
const uuid = require('uuid/v4');
const InvitationStorage = require('./data/invitationsStorage');
const storage = new InvitationStorage();

const action = async (req, res) => {
  try {
    logger.info(`putting invitation. Params = ${JSON.stringify(req.params)}. Body = ${JSON.stringify(req.body)}`);

    const invitationId = req.params.inv_id;
    const organisationId = req.params.org_id;
    const serviceId = req.params.svc_id;
    const roleId = req.body.roleId;

    await storage.upsert({
      invitationId,
      organisationId,
      serviceId,
      roleId,
    });

    res.status(202).send();
  } catch (e) {
    const id = uuid();
    logger.error(`error putting invitation (eid: ${id}) - ${e.message}`);
    res.status(500).send();
  }
};

module.exports = action;