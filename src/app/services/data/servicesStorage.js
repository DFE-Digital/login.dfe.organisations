'use strict';
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const config = require('./../../../infrastructure/config')();
const assert = require('assert');

let sequelize;
let organisation;
let userServices;
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

    }, {
      timestamps: false,
      tableName: 'service',
      schema: 'services'
    });
    await service.sync();
  }

  async _defineUserServiceModel() {
    userServices = sequelize.define('user_services', {
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

    userServices.belongsTo(organisation, {as: 'Organisation', foreignKey: 'organisation_id'});
    userServices.belongsTo(service, {as: 'Service', foreignKey: 'service_id'});

    await userServices.sync();
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

      const userService = await userServices.findAll(
        {
          where: {
            user_id: id
          }
        });


      let userServiceObject = [];

      await Promise.all(userService.map(async (uService) => {
        if (!uService) {
          const org = await uService.getOrganisation();
          const service = await uService.getService();

          const objectToAdd = {
            userService: {
              id: uService.getDataValue('id'),
              userId: uService.getDataValue('user_id'),
              status: uService.getDataValue('status')
            },
            organisation: {
              id: org.getDataValue('id'),
              name: org.getDataValue('name')
            },
            service: {
              id: service.getDataValue('id'),
              name: service.getDataValue('name')
            }
          };

          userServiceObject.push(objectToAdd);
        }
      }));


      //todo check if this is necessary
      //await sequelize.close();

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

      const userService = await userServices.findAll(
        {
          where: {
            user_id: id
          },
          attributes: [ 'service_id' ]
        });

      const ids = userService.map((userS) => {return userS.getDataValue('service_id')});

      const availableServices = await service.findAll(
        {
          where: {
            id: {
              [Op.notIn]: ids
            }
          }
        }
      );

      const services = availableServices.map((service) => { return {id:service.getDataValue('id'), name:service.getDataValue('name')} });

      return services.length !== 0 ? services : null;

    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = ServicesStorage;

