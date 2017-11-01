'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { users, services, roles } = require('./servicesSchema')();


class ServicesStorage {
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

  async getUsersOfService(id) {
    try {
      const userServiceEntities = await users.findAll(
        {
          where: {
            service_id: {
              [Op.eq]: id,
            },
          },
        });

      return await Promise.all(userServiceEntities.map(async userServiceEntity => ({
        id: userServiceEntity.getDataValue('user_id'),
        status: userServiceEntity.getDataValue('status'),
        role: roles.find(item => item.id === userServiceEntity.getDataValue('role_id')),
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
            userService: {
              id: userService.getDataValue('id'),
              userId: userService.getDataValue('user_id'),
              status: userService.getDataValue('status'),
            },
            organisation: {
              id: userService.Organisation.getDataValue('id'),
              name: userService.Organisation.getDataValue('name'),
            },
            service: {
              id: userService.Service.getDataValue('id'),
              name: userService.Service.getDataValue('name'),
              description: userService.Service.getDataValue('description'),
            },
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
      return returnValue.length !== 0 ? returnValue : null;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = ServicesStorage;

