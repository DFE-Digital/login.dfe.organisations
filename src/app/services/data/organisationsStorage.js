'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { organisations, organisationCategory, organisationStatus, establishmentTypes } = require('./../../../infrastructure/repository');


const list = async (includeAssociations = false) => {
  try {
    const findOrgsOpts = {};
    if (includeAssociations) {
      findOrgsOpts.include = ['associations'];
    }
    const orgEntities = await organisations.findAll(findOrgsOpts);
    if (!orgEntities) {
      return null;
    }

    return await Promise.all(orgEntities.map(async (serviceEntity) => {
      const organisation = {
        id: serviceEntity.getDataValue('id'),
        name: serviceEntity.getDataValue('name'),
        category: organisationCategory.find(c => c.id === serviceEntity.Category),
        type: establishmentTypes.find(c => c.id === serviceEntity.Type),
        urn: serviceEntity.URN,
        uid: serviceEntity.UID,
        ukprn: serviceEntity.UKPRN,
        establishmentNumber: serviceEntity.EstablishmentNumber,
        status: organisationStatus.find(c => c.id === serviceEntity.Status),
        closedOn: serviceEntity.ClosedOn,
        address: serviceEntity.Address,
      };

      if (serviceEntity.associations) {
        organisation.associations = serviceEntity.associations.map((assEntity) => ({
          associatedOrganisationId: assEntity.associated_organisation_id,
          associationType: assEntity.link_type,
        }));
      }

      return organisation;
    }));
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

const getOrgByUrn = async (urn) => {
  try {
    return await organisations.findOne(
      {
        where: {
          URN: {
            [Op.eq]: urn,
          },
        },
      });
  } catch (e) {
    logger.error(`error getting organisation by urn - ${e.message}`, e);
    throw e;
  }
};

const getOrgByUid = async (uid) => {
  try {
    return await organisations.findOne(
      {
        where: {
          UID: {
            [Op.eq]: uid,
          },
        },
      });
  } catch (e) {
    logger.error(`error getting organisation by uid - ${e.message}`, e);
    throw e;
  }
};

module.exports = {
  list,
  getOrgById,
  updateOrg,
  createOrg,
  getOrgByUrn,
  getOrgByUid,
};
