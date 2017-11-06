'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { organisations } = require('./servicesSchema')();


class OrganisationsStorage {
  async list() {
    try {
      const orgEntities = await organisations.findAll();
      if (!orgEntities) {
        return null;
      }

      return await Promise.all(orgEntities.map(async serviceEntity => ({
        id: serviceEntity.getDataValue('id'),
        name: serviceEntity.getDataValue('name'),
      })));
    } catch (e) {
      logger.error(`error getting organisations - ${e.message}`, e);
      throw e;
    }
  }

  async getOrgById(id) {
    return organisations.findById(id);
  }

  async updateOrg(id, name) {
    const org = await this.getOrgById(id);
    await org.updateAttributes({name});
  }

  async createOrg(id, name) {
    await organisations.create({
      id,
      name,
    });
  }
}


module.exports = OrganisationsStorage;