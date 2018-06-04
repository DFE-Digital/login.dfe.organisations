'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { users, services, roles, organisations, userOrganisations } = require('./../../../infrastructure/repository');
const uuid = require('uuid/v4');


const list = async (correlationId) => {
  try {
    logger.info(`Calling list for services storage for request ${correlationId}`, { correlationId });
    const serviceEntities = await services.findAll({
      order: ['name'],
    });
    if (!serviceEntities) {
      return null;
    }

    return await Promise.all(serviceEntities.map(async serviceEntity => ({
      id: serviceEntity.getDataValue('id'),
      name: serviceEntity.getDataValue('name'),
      description: serviceEntity.getDataValue('description'),
    })));
  } catch (e) {
    logger.error(`error getting services - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getServiceDetails = async (organisationId, serviceId, correlationId) => {
  try {
    logger.info(`Calling getServiceDetails for services storage for request ${correlationId}`, { correlationId });
    const service = await getById(serviceId);
    const organisation = await organisations.findById(organisationId);

    return { ...service, organisation: organisation.dataValues };
  } catch (e) {
    logger.error(`error getting service details org: ${organisationId}, service ${serviceId} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getById = async (id, correlationId) => {
  try {
    logger.info(`Calling getById for services storage for request ${correlationId}`, { correlationId });
    const serviceEntity = await services.find({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
    if (!serviceEntity) {
      return null;
    }
    return {
      id: serviceEntity.getDataValue('id'),
      name: serviceEntity.getDataValue('name'),
      description: serviceEntity.getDataValue('description'),
    };
  } catch (e) {
    logger.error(`error getting service ${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUsersOfService = async (organisationId, id, correlationId) => {
  try {
    logger.info(`Calling getUsersOfService for services storage for request ${correlationId}`, { correlationId });
    const userServiceEntities = await users.findAll(
      {
        where: {
          service_id: {
            [Op.eq]: id,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
        },
        include: ['Organisation'],
      });

    return await Promise.all(userServiceEntities.map(async (userServiceEntity) => {
      const role = await userServiceEntity.getRole();
      return {
        id: userServiceEntity.getDataValue('user_id'),
        status: userServiceEntity.getDataValue('status'),
        role,
        organisation: {
          id: userServiceEntity.Organisation.getDataValue('id'),
          name: userServiceEntity.Organisation.getDataValue('name'),
        },
      }
    }));
  } catch (e) {
    logger.error(`error getting users of service ${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getApproversOfServiceUserIds = async (organisationId, id, correlationId) => {
  try {
    logger.info(`Calling getApproversOfServiceUserIds for services storage for request ${correlationId}`, { correlationId });
    const approversServiceEntities = await userOrganisations.findAll(
      {
        where: {
          organisation_id: {
            [Op.eq]: organisationId,
          },
          role_id: {
            [Op.eq]: 10000,
          },
        },
      });
    return await Promise.all(approversServiceEntities.map(async approverServiceEntity => ({
      id: approverServiceEntity.getDataValue('user_id'),
    })));
  } catch (e) {
    logger.error(`error getting approver's of service ${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUserAssociatedServices = async (id, correlationId) => {
  try {
    logger.info(`Calling getUserAssociatedServices for services storage for request ${correlationId}`, { correlationId });
    const userServices = await users.findAll(
      {
        where: {
          user_id: {
            [Op.eq]: id,
          },
        },
        include: ['Organisation', 'Service'],
      });

    const mappedUserService = [];
    for (let i = 0; i <= userServices.length; i += 1) {
      const userService = userServices[i];
      if (userService) {
        const role = await userService.getRole();
        const approvers = await userService.getApprovers().map(user => user.user_id);
        const externalIdentifiers = await userService.getExternalIdentifiers().map(id => ({
          key: id.identifier_key,
          value: id.identifier_value
        }));
        mappedUserService.push({
          id: userService.Service.getDataValue('id'),
          name: userService.Service.getDataValue('name'),
          description: userService.Service.getDataValue('description'),
          status: userService.getDataValue('status'),
          userId: userService.getDataValue('user_id'),
          requestDate: userService.getDataValue('createdAt'),
          approvers,
          organisation: {
            id: userService.Organisation.getDataValue('id'),
            name: userService.Organisation.getDataValue('name'),
          },
          role,
          externalIdentifiers,
        });
      }
    }
    return mappedUserService;
  } catch (e) {
    logger.error(`error getting user associated services of user ${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUserUnassociatedServices = async (id, correlationId) => {
  try {
    logger.info(`Calling getUserUnassociatedServices for services storage for request ${correlationId}`, { correlationId });
    const userServices = await users.findAll(
      {
        where: {
          user_id: {
            [Op.eq]: id,
          },
        },
        attributes: ['service_id'],
      });

    const ids = userServices.map(userService => userService.getDataValue('service_id'));

    const availableServices = await services.findAll(
      {
        where: {
          id: {
            [Op.notIn]: ids,
          },
        },
      },
    );

    const returnValue = availableServices.map(service => ({
      id: service.getDataValue('id'),
      name: service.getDataValue('name'),
      description: service.getDataValue('description'),
    }));
    return returnValue;
  } catch (e) {
    logger.error(`error getting user unassociated services of user ${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const create = async (id, name, description, correlationId) => {
  try {
    logger.info(`Calling create for services storage for request ${correlationId}`, { correlationId });
    await services.create({
      id,
      name,
      description,
    });
  } catch (e) {
    logger.error(`error creating service ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
  }
};

const update = async (id, name, description, correlationId) => {
  try {
    logger.info(`Calling update for services storage for request ${correlationId}`, { correlationId });
    const serviceEntity = await services.find({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
    if (serviceEntity) {
      serviceEntity.updateAttributes({
        name,
        description,
      });
    }
  } catch (e) {
    logger.error(`error updating service ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
  }
};

// TODO: Remove this method
const upsertServiceUser = async (options, correlationId) => {
  logger.info(`Calling upsertServiceUser for services storage for request ${correlationId}`, { correlationId });
  const { id, userId, organisationId, serviceId, roleId, status, externalIdentifiers } = options;
  try {
    let userService = await users.findOne(
      {
        where: {
          user_id: {
            [Op.eq]: userId,
          },
          service_id: {
            [Op.eq]: serviceId,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
        },
      });
    if (userService) {
      await userService.destroy();
    }
    userService = await users.create({
      id,
      user_id: userId,
      organisation_id: organisationId,
      service_id: serviceId,
      status,
    });

    const userOrganisation = await userOrganisations.find({
      where: {
        user_id: {
          [Op.eq]: userId,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
    });
    if (!userOrganisation || userOrganisation.role_id !== roleId) {
      if (userOrganisation) {
        await userOrganisation.destroy();
      }

      await userOrganisations.create({
        user_id: userId,
        organisation_id: organisationId,
        role_id: roleId,
      });
    }

    if (externalIdentifiers) {
      for (let i = 0; i < externalIdentifiers.length; i += 1) {
        const extId = externalIdentifiers[i];
        userService.setExternalIdentifier(extId.key, extId.value);
      }
    }
  } catch (e) {
    logger.error(`Error in upsertServiceUser ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUserService = async (serviceId, organisationId, userId, correlationId) => {
  try {
    logger.info(`Calling getUserService for services storage for request ${correlationId}`, { correlationId });
    const userServiceEntity = await users.findOne(
      {
        where: {
          user_id: {
            [Op.eq]: userId,
          },
          service_id: {
            [Op.eq]: serviceId,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
        },
        include: ['Organisation', 'Service'],
      });
    const role = await userServiceEntity.getRole();

    return {
      userId: userServiceEntity.getDataValue('user_id'),
      status: userServiceEntity.getDataValue('status'),
      role,
      service: {
        id: userServiceEntity.Service.getDataValue('id'),
        name: userServiceEntity.Service.getDataValue('name'),
      },
      organisation: {
        id: userServiceEntity.Organisation.getDataValue('id'),
        name: userServiceEntity.Organisation.getDataValue('name'),
      },
    };
  } catch (e) {
    logger.error(`error getting user service information for org: ${organisationId}, service ${serviceId} and user:${userId} -  ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getExternalIdentifier = async (serviceId, identifierKey, identifierValue, correlationId) => {
  try {
    logger.info(`Calling getExternalIdentifier for services storage for request ${correlationId}`, { correlationId });
    const serviceEntity = await services.find({
      where: {
        id: {
          [Op.eq]: serviceId,
        },
      },
    });
    if (!serviceEntity) {
      return null;
    }

    const externalIdentifier = await serviceEntity.getExternalIdentifier(identifierKey, identifierValue);
    if (!externalIdentifier) {
      return null;
    }

    return {
      userId: externalIdentifier.getDataValue('user_id'),
      serviceId: externalIdentifier.getDataValue('service_id'),
      organisationId: externalIdentifier.getDataValue('organisation_id'),
      key: externalIdentifier.getDataValue('identifier_key'),
      value: externalIdentifier.getDataValue('identifier_value'),
    };
  } catch (e) {
    logger.error(`error getting service ${serviceId} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const upsertExternalIdentifier = async (serviceId, userId, organisationId, identifierKey, identifierValue, correlationId) => {
  try {
    logger.info(`Calling upsertExternalIdentifier for services storage for request ${correlationId}`, { correlationId });

    const userService = await users.findOne(
      {
        where: {
          user_id: {
            [Op.eq]: userId,
          },
          service_id: {
            [Op.eq]: serviceId,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
        },
      });
    if (!userService) {
      return null;
    }

    await userService.setExternalIdentifier(identifierKey, identifierValue);
  } catch (e) {
    logger.error(`error calling upsertExternalIdentifier for user ${userId} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const upsertUserService = async (organisationId, serviceId, userId, status, correlationId) => {
  logger.info(`Calling upsertUserService for services storage for request ${correlationId}`, { correlationId });
  try {
    const userService = await users.findOne(
      {
        where: {
          user_id: {
            [Op.eq]: userId,
          },
          service_id: {
            [Op.eq]: serviceId,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
        },
      });
    if (userService) {
      if (userService.status !== status) {
        userService.status = status;
        await userService.save();
      }
      return userService.id;
    }

    const id = uuid();
    await users.create({
      id,
      user_id: userId,
      organisation_id: organisationId,
      service_id: serviceId,
      status,
    });
    return id;
  } catch (e) {
    logger.error(`Error in upsertUserService for request ${correlationId} - ${e.message}`, {
      correlationId,
      errorMessage: e.message,
      errorCode: e.code,
      stackTrace: e.stack,
    });
    throw e;
  }
};

module.exports = {
  list,
  getServiceDetails,
  getById,
  getUsersOfService,
  getUserAssociatedServices,
  getUserUnassociatedServices,
  create,
  update,
  upsertServiceUser,
  getUserService,
  getApproversOfServiceUserIds,
  getExternalIdentifier,
  upsertExternalIdentifier,
  upsertUserService,
};

