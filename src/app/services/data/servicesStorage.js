'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const config = require('./../../../infrastructure/config')();
const assert = require('assert');
const createSchema = require('./servicesSchema');

let sequelize;

class ServicesStorage {
  constructor(dataConnection) {
    if (dataConnection) {
      sequelize = dataConnection;
    } else {
      assert(config.database.username, 'Database property username must be supplied');
      assert(config.database.password, 'Database property password must be supplied');
      assert(config.database.host, 'Database property host must be supplied');
      sequelize = new Sequelize('postgres', config.database.username, config.database.password, {
        host: config.database.host,
        dialect: 'postgres',
      });

      this.schema = createSchema(sequelize);
    }
  }

  async getUserAssociatedServices(id) {
    try {
      await sequelize.authenticate();

      const userServices = await this.schema.users.findAll(
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
            role: this.schema.roles.find(item => item.id === userService.getDataValue('role_id')),
          };
        }
        return [];
      }));

      return userServiceObject.length !== 0 ? userServiceObject : null;
    } catch (e) {
      logger.error(e);
      throw e;
    } finally {
      await sequelize.close();
    }
  }

  async getUserUnassociatedServices(id) {
    try {
      await sequelize.authenticate();

      const userServices = await this.schema.users.findAll(
        {
          where: {
            user_id: {
              [Op.eq]: id,
            },
          },
          attributes: ['service_id'],
        });

      const ids = userServices.map(userService => userService.getDataValue('service_id'));

      const availableServices = await this.schema.services.findAll(
        {
          where: {
            id: {
              [Op.notIn]: ids,
            },
          },
        },
      );

      const services = availableServices.map(service => ({
        id: service.getDataValue('id'),
        name: service.getDataValue('name'),
        description: service.getDataValue('description'),
      }));
      return services.length !== 0 ? services : null;
    } catch (e) {
      logger.error(e);
      throw e;
    } finally {
      await sequelize.close();
    }
  }
}

module.exports = ServicesStorage;

