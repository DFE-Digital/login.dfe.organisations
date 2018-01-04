'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { invitations, roles } = require('./../../../infrastructure/repository');

const list = async (correlationId) => {
  try {
    logger.info(`List invitation for request ${correlationId}`, {correlationId});
    const invitationEntities = await invitations.findAll({
      include: ['Organisation', 'Service'],
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
    logger.error(`error getting invitations - ${e.message} for request ${correlationId} error: ${e}`, {correlationId});
    throw e;
  }
};

const getForInvitationId = async (id, correlationId) => {
  try {
    logger.info(`Get invitation for request ${correlationId}`, {correlationId});
    const invitationEntities = await invitations.findAll(
      {
        where: {
          invitation_id: {
            [Op.eq]: id,
          },
        },
        include: ['Organisation', 'Service'],
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
    logger.error(`error getting services for invitation - ${e.message} for request ${correlationId} error: ${e}`, {correlationId});
    throw e;
  }
};

const upsert = async (details, correlationId) => {
  logger.info(`Upsert invitation for request ${correlationId}`, {correlationId});
  const { invitationId, organisationId, serviceId, roleId } = details;
  try {
    const invitation = await invitations.findOne(
      {
        where: {
          invitation_id: {
            [Op.eq]: invitationId,
          },
          service_id: {
            [Op.eq]: serviceId,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
        },
      });

    if (invitation) {
      await invitation.destroy();
    }
    await invitations.create({
      invitation_id: invitationId,
      organisation_id: organisationId,
      service_id: serviceId,
      role_id: roleId,
    });
  } catch (e) {
    logger.error(`Error in InvitationsStorage.upsert ${e.message} for request ${correlationId} error: ${e}`, {correlationId});
    throw e;
  }
};

module.exports = {
  list,
  getForInvitationId,
  upsert,
};
