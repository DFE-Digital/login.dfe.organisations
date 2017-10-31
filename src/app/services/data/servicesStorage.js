'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const config = require('./../../../infrastructure/config')();
const assert = require('assert');

const roles = [
  { id: 0, name: 'End user' },
  { id: 10000, name: 'Approver' },
];

let sequelize;
let organisation;
let userServicesDataModel;
let service;

class ServicesStorage {
  async _defineOrganisationServiceModel() {
    organisation = sequelize.define('organisation', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

    }, {
      timestamps: false,
      tableName: 'organisation',
      schema: 'services',
    });
    await organisation.sync();
  }

  async _defineServiceModel() {
    service = sequelize.define('service', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    }, {
      timestamps: false,
      tableName: 'service',
      schema: 'services',
    });
    await service.sync();
  }

  async _defineUserServiceModel() {
    userServicesDataModel = sequelize.define('user_services', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
    }, {
      timestamps: false,
      tableName: 'user_services',
      schema: 'services',
    });

    userServicesDataModel.belongsTo(organisation, { as: 'Organisation', foreignKey: 'organisation_id' });
    userServicesDataModel.belongsTo(service, { as: 'Service', foreignKey: 'service_id' });

    await userServicesDataModel.sync();
  }

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
    }
  }

  async getUserAssociatedServices(id) {
    try {
      await sequelize.authenticate();

      await this._defineOrganisationServiceModel();
      await this._defineServiceModel();
      await this._defineUserServiceModel();

      const userServices = await userServicesDataModel.findAll(
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
          const objectToAdd = {
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
          return objectToAdd;
        } else {
          return null;
        }
      }));


      // todo check if this is necessary
      await sequelize.close();

      return userServiceObject.length !== 0 ? userServiceObject : null;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async getUserUnassociatedServices(id) {
    try {
      await sequelize.authenticate();

      await this._defineOrganisationServiceModel();
      await this._defineServiceModel();
      await this._defineUserServiceModel();

      const userServices = await userServicesDataModel.findAll(
        {
          where: {
            user_id: id,
          },
          attributes: ['service_id'],
        });

      const ids = userServices.map(userService => userService.getDataValue('service_id'));

      const availableServices = await service.findAll(
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

      await sequelize.close();

      return services.length !== 0 ? services : null;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = ServicesStorage;
