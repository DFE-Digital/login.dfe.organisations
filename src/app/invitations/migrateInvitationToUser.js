'use strict';

const uuid = require('uuid/v4');
const invitationStorage = require('./data/invitationsStorage');
const serviceStorage = require('./../services/data/servicesStorage');

const APPROVED_STATUS = 1;

const handler = async (req, res) => {
  const invitationId = req.params.inv_id;
  const userId = req.body.user_id;

  const services = await invitationStorage.getForInvitationId(invitationId, req.header('x-correlation-id'));
  if (services) {
    const promises = services.map(s => serviceStorage.upsertServiceUser({
      id: uuid(),
      userId,
      organisationId: s.organisation.id,
      serviceId: s.service.id,
      roleId: s.role.id,
      status: APPROVED_STATUS,
    }, req.header('x-correlation-id')));

    await Promise.all(
      promises,
    );

    res.status(202).send();
  }
};


module.exports = handler;
