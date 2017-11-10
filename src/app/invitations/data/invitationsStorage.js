'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { invitations, services, roles, organisations } = require('./../../../infrastructure/repository');

class InvitationsStorage {
  async list() {
    try {
      const invitationEntities = await invitations.findAll({
        include: ['Organisation', 'Service']
      });
      if (!invitationEntities) {
        return null;
      }

      return await Promise.all(invitationEntities.map(async invitationEntity => ({
        invitationId: invitationEntity.getDataValue('invitation_id'),
        role: roles.find(item => item.id === invitationEntity.getDataValue('role_id')),
        service: {
          id: invitationEntity.Service.getDataValue('id'),
          name: invitationEntity.Service.getDataValue('name'),
        },
        organisation: {
          id: invitationEntity.Organisation.getDataValue('id'),
          name: invitationEntity.Organisation.getDataValue('name'),
        },
      })));
    } catch (e) {
      logger.error(`error getting invitations - ${e.message}`, e);
      throw e;
    }
  }
}

module.exports = InvitationsStorage;