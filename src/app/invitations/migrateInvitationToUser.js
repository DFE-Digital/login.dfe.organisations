'use strict';

const config = require('./../../infrastructure/config')();
const uuid = require('uuid/v4');
const invitationStorage = require('./data/invitationsStorage');
const serviceStorage = require('./../services/data/servicesStorage');
const organisationsStorage = require('./../organisations/data/organisationsStorage');
const { encodeNumberToString } = require('./../../utils');

const APPROVED_STATUS = 1;

const handler = async (req, res) => {
  const invitationId = req.params.inv_id;
  const userId = req.body.user_id;

  const services = await invitationStorage.getForInvitationId(invitationId, req.header('x-correlation-id'));
  if (services) {
    for (let o = 0; o < services.length; o += 1) {
      const org = services[o];
      let numericIdentifier;
      let textIdentifier;

      if (config.toggles && config.toggles.generateUserOrgIdentifiers) {
        numericIdentifier = await organisationsStorage.getNextUserOrgNumericIdentifier();

        const options = encodeNumberToString(numericIdentifier);
        let current;
        let index = 1;
        let inUse;
        while ((!current || inUse) && index <= 5) {
          current = options[`option${index}`];
          const exiting = await organisationsStorage.getUserOrganisationByTextIdentifier(current);
          inUse = exiting && !(exiting.user_id === userId && exiting.organisation_id === org.organisation.id);
          index += 1;
        }
        if (inUse) {
          return res.status(500).send();
        }
        textIdentifier = current;
      }

      await organisationsStorage.setUserAccessToOrganisation(org.organisation.id, userId, org.role.id, APPROVED_STATUS, '', numericIdentifier, textIdentifier);

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
