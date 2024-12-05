const Sequelize = require("sequelize");

const Op = Sequelize.Op;
const logger = require("./../../../infrastructure/logger");
const {
  invitations,
  invitationOrganisations,
  organisationCategory,
  establishmentTypes,
  invitationServiceRoles,
} = require("./../../../infrastructure/repository");

const list = async (correlationId) => {
  try {
    logger.info(`List invitation for request ${correlationId}`, {
      correlationId,
    });
    const invitationEntities = await invitations.findAll({
      include: ["Organisation", "Service"],
    });
    if (!invitationEntities) {
      return null;
    }

    return await Promise.all(
      invitationEntities.map(async (invitationEntity) => {
        const role = invitationEntity.getRole();
        return {
          invitationId: invitationEntity.getDataValue("invitation_id"),
          role,
          service: {
            id: invitationEntity.Service.getDataValue("id"),
            name: invitationEntity.Service.getDataValue("name"),
          },
          organisation: {
            id: invitationEntity.Organisation.getDataValue("id"),
            name: invitationEntity.Organisation.getDataValue("name"),
          },
        };
      }),
    );
  } catch (e) {
    logger.error(
      `error getting invitations - ${e.message} for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const listInvitationServices = async (page, pageSize, correlationId) => {
  try {
    const resultset = await invitations.findAndCountAll({
      limit: pageSize,
      offset: page !== 1 ? pageSize * (page - 1) : 0,
      include: ["Organisation", "Service"],
    });

    const mapped = [];
    for (let i = 0; i < resultset.rows.length; i++) {
      const entity = resultset.rows[i];
      const role = await entity.getRole();

      mapped.push({
        id: entity.Service.getDataValue("id"),
        name: entity.Service.getDataValue("name"),
        description: entity.Service.getDataValue("description"),
        invitationId: entity.getDataValue("invitation_id"),
        organisation: {
          id: entity.Organisation.getDataValue("id"),
          name: entity.Organisation.getDataValue("name"),
          urn: entity.Organisation.getDataValue("URN") || undefined,
          uid: entity.Organisation.getDataValue("UID") || undefined,
          ukprn: entity.Organisation.getDataValue("UKPRN") || undefined,
          category: organisationCategory.find(
            (c) => c.id === entity.Organisation.getDataValue("Category"),
          ),
          type: establishmentTypes.find(
            (t) => t.id === entity.Organisation.getDataValue("Type"),
          ),
        },
        role,
      });
    }
    return {
      services: mapped,
      page,
      totalNumberOfPages: Math.ceil(resultset.count / pageSize),
      totalNumberOfRecords: resultset.count,
    };
  } catch (e) {
    logger.error(
      `error listing page ${page} of invitations (with size of ${pageSize}) - ${e.message} (correlation id: ${correlationId}`,
      { correlationId },
    );
    throw e;
  }
};

const getForInvitationId = async (id, correlationId) => {
  try {
    logger.info(`Get invitation for request ${correlationId}`, {
      correlationId,
    });

    const invitationOrgs = await invitationOrganisations.findAll({
      where: {
        invitation_id: {
          [Op.eq]: id,
        },
      },
      include: ["Organisation"],
    });
    return Promise.all(
      invitationOrgs.map(async (invitationOrg) => {
        const role = await invitationOrg.getRole();
        const approvers = (await invitationOrg.getApprovers()).map(
          (user) => user.user_id,
        );
        const services = await invitations.findAll({
          where: {
            invitation_id: {
              [Op.eq]: id,
            },
            organisation_id: {
              [Op.eq]: invitationOrg.Organisation.getDataValue("id"),
            },
          },
          include: ["Service"],
        });

        return {
          invitationId: invitationOrg.getDataValue("invitation_id"),
          organisation: {
            id: invitationOrg.Organisation.getDataValue("id"),
            name: invitationOrg.Organisation.getDataValue("name"),
            urn: invitationOrg.Organisation.getDataValue("URN") || undefined,
            uid: invitationOrg.Organisation.getDataValue("UID") || undefined,
            ukprn:
              invitationOrg.Organisation.getDataValue("UKPRN") || undefined,
            category: organisationCategory.find(
              (c) =>
                c.id === invitationOrg.Organisation.getDataValue("Category"),
            ),
            type: establishmentTypes.find(
              (t) => t.id === invitationOrg.Organisation.getDataValue("Type"),
            ),
          },
          role,
          approvers,
          services: await Promise.all(
            services.map(async (service) => {
              const externalIdentifiers = (
                await service.getExternalIdentifiers()
              ).map((extId) => ({
                key: extId.identifier_key,
                value: extId.identifier_value,
              }));
              const serviceRoles = await invitationServiceRoles.findAll({
                where: {
                  invitation_id: {
                    [Op.eq]: id,
                  },
                  organisation_id: {
                    [Op.eq]: invitationOrg.Organisation.getDataValue("id"),
                  },
                  service_id: {
                    [Op.eq]: service.Service.getDataValue("id"),
                  },
                },
                include: ["Role"],
              });

              return {
                id: service.Service.getDataValue("id"),
                name: service.Service.getDataValue("name"),
                externalIdentifiers,
                serviceRoles,
              };
            }),
          ),
        };
      }),
    );
  } catch (e) {
    logger.error(
      `error getting services for invitation - ${e.message} for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const deleteInvitationOrganisation = async (
  organisationId,
  invitationId,
  correlationId,
) => {
  try {
    logger.info(
      `Deleting org ${organisationId} for invitation ${invitationId} for ${correlationId}`,
      { correlationId },
    );
    await invitationOrganisations.destroy({
      where: {
        invitation_id: {
          [Op.eq]: invitationId,
        },
        organisation_id: {
          [Op.eq]: organisationId,
        },
      },
    });
  } catch (e) {
    logger.error(
      `error deleting organisation for user- ${e.message} (id: ${correlationId})`,
      { correlationId },
    );
    throw e;
  }
};

const upsert = async (details, correlationId) => {
  logger.info(`Upsert invitation for request ${correlationId}`, {
    correlationId,
  });
  const { invitationId, organisationId, serviceId, roleId } = details;
  try {
    if (serviceId) {
      let invitation = await invitations.findOne({
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

      if (details.externalIdentifiers) {
        for (let i = 0; i < details.externalIdentifiers.length; i += 1) {
          const extId = details.externalIdentifiers[i];
          await invitation.setExternalIdentifier(extId.key, extId.value);
        }
      }
    }

    await invitationOrganisations.upsert({
      invitation_id: invitationId,
      organisation_id: organisationId,
      role_id: roleId,
    });
  } catch (e) {
    logger.error(
      `Error in InvitationsStorage.upsert ${e.message} for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

module.exports = {
  list,
  listInvitationServices,
  getForInvitationId,
  upsert,
  deleteInvitationOrganisation,
};
