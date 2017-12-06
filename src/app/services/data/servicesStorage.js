'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { users, services, roles, organisations } = require('./../../../infrastructure/repository');


const list = async () => {
  try {
    const serviceEntities = await services.findAll();
    if (!serviceEntities) {
      return null;
    }

    return await Promise.all(serviceEntities.map(async serviceEntity => ({
      id: serviceEntity.getDataValue('id'),
      name: serviceEntity.getDataValue('name'),
      description: serviceEntity.getDataValue('description'),
    })));
  } catch (e) {
    logger.error(`error getting services - ${e.message}`, e);
    throw e;
  }
};

const getServiceDetails = async (organisationId, serviceId) => {
  try {
    const service = await this.getById(serviceId);
    const organisation = await organisations.findById(organisationId);

    return { ...service, organisation: organisation.dataValues };
  } catch (e) {
    logger.error(`error getting service details org: ${organisationId}, service ${serviceId} - ${e.message}`, e);
    throw e;
  }
};

const getById = async (id) => {
  try {
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
    logger.error(`error getting service ${id} - ${e.message}`, e);
    throw e;
  }
};

const getUsersOfService = async (organisationId, id) => {
  try {
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

    return await Promise.all(userServiceEntities.map(async userServiceEntity => ({
      id: userServiceEntity.getDataValue('user_id'),
      status: userServiceEntity.getDataValue('status'),
      role: roles.find(item => item.id === userServiceEntity.getDataValue('role_id')),
      organisation: {
        id: userServiceEntity.Organisation.getDataValue('id'),
        name: userServiceEntity.Organisation.getDataValue('name'),
      },
    })));
  } catch (e) {
    logger.error(`error getting users of service ${id} - ${e.message}`, e);
    throw e;
  }
};

const getApproversOfServiceUserIds = async (organisationId, id) => {
  try {
    const approversServiceEntities = await users.findAll(
      {
        where: {
          service_id: {
            [Op.eq]: id,
          },
          organisation_id: {
            [Op.eq]: organisationId,
          },
          role_id: {
            [Op.eq]: 10000,
          },
          status: {
            [Op.eq]: 1,
          },
        },
      });
    return await Promise.all(approversServiceEntities.map(async approverServiceEntity => ({
      id: approverServiceEntity.getDataValue('user_id'),
    })));
  } catch (e) {
    logger.error(`error getting approver's of service ${id} - ${e.message}`, e);
    throw e;
  }
};

const getUserAssociatedServices = async (id) => {
  try {
    const userServices = await users.findAll(
      {
        where: {
          user_id: {
            [Op.eq]: id,
          },
        },
        include: ['Organisation', 'Service'],
      });

    return await Promise.all(userServices.map(async (userService) => {
      if (userService) {
        return {
          id: userService.Service.getDataValue('id'),
          name: userService.Service.getDataValue('name'),
          description: userService.Service.getDataValue('description'),
          status: userService.getDataValue('status'),
          userId: userService.getDataValue('user_id'),
          requestDate: userService.getDataValue('createdAt'),
          approvers: await userService.getApprovers().map((user) => {
            return user.user_id;
          }),
          organisation: {
            id: userService.Organisation.getDataValue('id'),
            name: userService.Organisation.getDataValue('name'),
          },
          role: roles.find(item => item.id === userService.getDataValue('role_id')),
        };
      }
      return {};
    }));
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

const getUserUnassociatedServices = async (id) => {
  try {
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
    logger.error(e);
    throw e;
  }
};

const create = async (id, name, description) => {
  await services.create({
    id,
    name,
    description,
  });
};

const update = async (id, name, description) => {
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
};

const upsertServiceUser = async (options) => {
  const { id, userId, organisationId, serviceId, roleId, status } = options;
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
      await userService.destroy();
    }
    await users.create({
      id,
      user_id: userId,
      organisation_id: organisationId,
      service_id: serviceId,
      role_id: roleId,
      status,
    });
  } catch (e) {
    logger.error(`Error in upsertServiceUser ${e.message}`);
    throw e;
  }
};

const getUserService = async (serviceId, organisationId, userId) => {
  try {
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

    return {
      userId: userServiceEntity.getDataValue('user_id'),
      status: userServiceEntity.getDataValue('status'),
      role: roles.find(item => item.id === userServiceEntity.getDataValue('role_id')),
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
    logger.error(`error getting user service information for org: ${organisationId}, service ${serviceId} and user:${userId} -  ${e.message}`, e);
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
};

