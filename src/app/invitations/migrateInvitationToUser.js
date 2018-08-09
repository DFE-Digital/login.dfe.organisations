'use strict';

const uuid = require('uuid/v4');
const invitationStorage = require('./data/invitationsStorage');
const serviceStorage = require('./../services/data/servicesStorage');
const organisationsStorage = require('./../organisations/data/organisationsStorage');

const APPROVED_STATUS = 1;

const handler = async (req, res) => {
  const invitationId = req.params.inv_id;
  const userId = req.body.user_id;

  const services = await invitationStorage.getForInvitationId(invitationId, req.header('x-correlation-id'));
  if (services) {
    for (let o = 0; o < services.length; o += 1) {
      const org = services[o];

      await organisationsStorage.setUserAccessToOrganisation(org.organisation.id, userId, org.role.id, APPROVED_STATUS, '');

      for (let s = 0; s < org.services.length; s += 1) {
        const svc = org.services[s];
        await serviceStorage.upsertServiceUser({
          id: uuid(),
          userId,
          organisationId: org.organisation.id,
          serviceId: svc.id,
          roleId: org.role.id,
          status: APPROVED_STATUS,
          externalIdentifiers: svc.externalIdentifiers,
        }, req.header('x-correlation-id'));
      }
    }
  }

  res.status(202).send();
};


module.exports = handler;
