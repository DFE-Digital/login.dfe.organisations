'use strict';
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const config = require('./../../../infrastructure/config')();
const assert = require('assert');

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
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

    }, {
      timestamps: false,
      tableName: 'organisation',
      schema: 'services'
    });
    await organisation.sync();
  }

  async _defineServiceModel() {
    service = sequelize.define('service', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
    }, {
      timestamps: false,
      tableName: 'service',
      schema: 'services'
    });
    await service.sync();
  }

  async _defineUserServiceModel() {
    userServicesDataModel = sequelize.define('user_services', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },

    }, {
      timestamps: false,
      tableName: 'user_services',
      schema: 'services'
    });

    userServicesDataModel.belongsTo(organisation, {as: 'Organisation', foreignKey: 'organisation_id'});
    userServicesDataModel.belongsTo(service, {as: 'Service', foreignKey: 'service_id'});

    await userServicesDataModel.sync();
  }

  constructor(dataConnection) {
    if (dataConnection) {
      sequelize = dataConnection;
    }
    else {
      assert(config.database.username, 'Database property username must be supplied');
      assert(config.database.password, 'Database property password must be supplied');
      assert(config.database.host, 'Database property host must be supplied');
      sequelize = new Sequelize('postgres', config.database.username, config.database.password, {
        host: config.database.host,
        dialect: 'postgres'
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
            user_id: id
          }
        });

      let userServiceObject = await Promise.all(userServices.map(async (userService) => {
        if (userService) {
          const org = await userService.getOrganisation();
          const service = await userService.getService();

          const objectToAdd = {
            userService: {
              id: userService.getDataValue('id'),
              userId: userService.getDataValue('user_id'),
              status: userService.getDataValue('status')
            },
            organisation: {
              id: org.getDataValue('id'),
              name: org.getDataValue('name')
            },
            service: {
              id: service.getDataValue('id'),
              name: service.getDataValue('name'),
              description: service.getDataValue('description')
            }
          };
          return objectToAdd;
        }
      }));


      //todo check if this is necessary
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
            user_id: id
          },
          attributes: ['service_id']
        });

      const ids = userServices.map((userService) => {
        return userService.getDataValue('service_id')
      });

      const availableServices = await service.findAll(
        {
          where: {
            id: {
              [Op.notIn]: ids
            }
          }
        }
      );

      const services = availableServices.map((service) => {
        return {
          id: service.getDataValue('id'),
          name: service.getDataValue('name'),
          description: service.getDataValue('description')
        }
      });

      await sequelize.close();

      return services.length !== 0 ? services : null;

    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = ServicesStorage;

