'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { invitations, invitationOrganisations } = require('./../../../infrastructure/repository');

const list = async (correlationId) => {
  try {
    logger.info(`List invitation for request ${correlationId}`, { correlationId });
    const invitationEntities = await invitations.findAll({
      include: ['Organisation', 'Service'],
    });
    if (!invitationEntities) {
      return null;
    }

    return await Promise.all(invitationEntities.map(async (invitationEntity) => {
      const role = invitationEntity.getRole();
      return {
        invitationId: invitationEntity.getDataValue('invitation_id'),
        role,
        service: {
          id: invitationEntity.Service.getDataValue('id'),
          name: invitationEntity.Service.getDataValue('name'),
        },
        organisation: {
          id: invitationEntity.Organisation.getDataValue('id'),
          name: invitationEntity.Organisation.getDataValue('name'),
        },
      };
    }));
  } catch (e) {
    logger.error(`error getting invitations - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getForInvitationId = async (id, correlationId) => {
  try {
    logger.info(`Get invitation for request ${correlationId}`, { correlationId });
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

    return await Promise.all(invitationEntities.map(async (invitationEntity) => {
      const approvers = await invitationEntity.getApprovers().map(user => user.user_id);
      const externalIdentifiers = await invitationEntity.getExternalIdentifiers().map(extId => ({
        key: extId.identifier_key,
        value: extId.identifier_value,
      }));
      const role = await invitationEntity.getRole();
      return {
        invitationId: invitationEntity.getDataValue('invitation_id'),
        role,
        service: {
          id: invitationEntity.Service.getDataValue('id'),
          name: invitationEntity.Service.getDataValue('name'),
        },
        organisation: {
          id: invitationEntity.Organisation.getDataValue('id'),
          name: invitationEntity.Organisation.getDataValue('name'),
        },
        approvers,
        externalIdentifiers,
      };
    }));
  } catch (e) {
    logger.error(`error getting services for invitation - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const upsert = async (details, correlationId) => {
  logger.info(`Upsert invitation for request ${correlationId}`, { correlationId });
  const { invitationId, organisationId, serviceId, roleId } = details;
  try {
    let invitation = await invitations.findOne(
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
    invitation = await invitations.create({
      invitation_id: invitationId,
      organisation_id: organisationId,
      service_id: serviceId,
    });

    const invitationOrganisation = await invitationOrganisations.find({
      where: {
        invitation_id: {
          [Op.eq]: invitationId,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
    });
    if (!invitationOrganisation || invitationOrganisation.role_id !== roleId) {
      if (invitationOrganisation) {
        await invitationOrganisation.destroy();
      }

      await invitationOrganisations.create({
        invitation_id: invitationId,
        organisation_id: organisationId,
        role_id: roleId,
      });
    }

    if (details.externalIdentifiers) {
      for (let i = 0; i < details.externalIdentifiers.length; i += 1) {
        const extId = details.externalIdentifiers[i];
        await invitation.setExternalIdentifier(extId.key, extId.value);
      }
    }
  } catch (e) {
    logger.error(`Error in InvitationsStorage.upsert ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

module.exports = {
  list,
  getForInvitationId,
  upsert,
};
