'use strict';

const uuid = require('uuid/v4');
const InvitationStorage = require('./data/invitationsStorage');
const ServiceStorage = require('./../services/data/servicesStorage');

const storage = new InvitationStorage();
const serviceStorage = new ServiceStorage();

const APPROVED_STATUS = 1;

const handler = async (req, res) => {
  const invitationId = req.params.inv_id;
  const userId = req.body.user_id;

  const services = await storage.getForInvitationId(invitationId);
  if (services) {
    const promises = services.forEach((s) => {
      return serviceStorage.upsertServiceUser({
        id: uuid(),
        userId,
        organisationId: s.organisation.id,
        serviceId: s.service.id,
        roleId: s.role.id,
        status: APPROVED_STATUS
      });
    });

    await Promise.all(
      promises,
    );

    res.status(202).send();
  }
};


module.exports = handler;
