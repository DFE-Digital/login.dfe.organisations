'use strict';

const logger = require('./../../../infrastructure/logger');
const { organisations, organisationCategory, organisationStatus } = require('./../../../infrastructure/repository');


const list = async () => {
  try {
    const orgEntities = await organisations.findAll();
    if (!orgEntities) {
      return null;
    }

    return await Promise.all(orgEntities.map(async serviceEntity => ({
      id: serviceEntity.getDataValue('id'),
      name: serviceEntity.getDataValue('name'),
      category: organisationCategory.find(c => c.id === serviceEntity.Category),
      type: serviceEntity.Type,
      urn: serviceEntity.URN,
      uid: serviceEntity.UID,
      ukprn: serviceEntity.UKPRN,
      establishmentNumber: serviceEntity.EstablishmentNumber,
      status: organisationStatus.find(c => c.id === serviceEntity.Status),
      closedOn: serviceEntity.ClosedOn,
    })));
  } catch (e) {
    logger.error(`error getting organisations - ${e.message}`, e);
    throw e;
  }
};

const getOrgById = async id => organisations.findById(id);

const updateOrg = async (id, name) => {
  const org = await this.getOrgById(id);
  await org.updateAttributes({ name });
};

const createOrg = async (id, name) => {
  await organisations.create({
    id,
    name,
  });
};


module.exports = {
  list,
  getOrgById,
  updateOrg,
  createOrg,
};
