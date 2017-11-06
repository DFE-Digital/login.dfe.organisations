'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { users, services, roles, organisations } = require('./servicesSchema')();


class ServicesStorage {


  async list() {
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
  }

  async getServiceDetails(organisationId, serviceId) {
    try {
      const service = await this.getById(serviceId);
      const organisation = await organisations.findById(organisationId);

      return { ...service, organisation: organisation.dataValues };
    } catch (e) {
      logger.error(`error getting service details org: ${organisationId}, service ${serviceId} - ${e.message}`, e);
      throw e;
    }
  }

  async getById(id) {
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
  }

  async getUsersOfService(organisationId, id) {
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
  }

  async getUserAssociatedServices(id) {
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

      const userServiceObject = await Promise.all(userServices.map(async (userService) => {
        if (userService) {
          return {
            id: userService.Service.getDataValue('id'),
            name: userService.Service.getDataValue('name'),
            description: userService.Service.getDataValue('description'),
            status: userService.getDataValue('status'),
            // userService: {
            //   id: userService.getDataValue('id'),
            //   userId: userService.getDataValue('user_id'),
            //   status: userService.getDataValue('status'),
            // },
            organisation: {
              id: userService.Organisation.getDataValue('id'),
              name: userService.Organisation.getDataValue('name'),
            },
            // service: {
            //   id: userService.Service.getDataValue('id'),
            //   name: userService.Service.getDataValue('name'),
            //   description: userService.Service.getDataValue('description'),
            // },
            role: roles.find(item => item.id === userService.getDataValue('role_id')),
          };
        }
        return [];
      }));

      return userServiceObject.length !== 0 ? userServiceObject : null;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async getUserUnassociatedServices(id) {
    try {
      const userServices =  await users.findAll(
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
  }

  async create(id, name, description) {
    await services.create({
      id,
      name,
      description,
    });
  }

  async update(id, name, description) {
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
  }

  async upsertServiceUser(options) {
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
  }


}

module.exports = ServicesStorage;

