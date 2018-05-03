const logger = require('./../../../infrastructure/logger');
const { list, getOrgById, getOrgByUrn, getOrgByUid } = require('./../../services/data/organisationsStorage');
const { organisations, organisationStatus, organisationCategory, establishmentTypes, organisationAssociations, userOrganisations, users } = require('./../../../infrastructure/repository');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const updateEntityFromOrganisation = (entity, organisation) => {
  entity.name = organisation.name;
  entity.Category = organisation.category.id;
  entity.Type = organisation.type ? organisation.type.id : null;
  entity.URN = organisation.urn;
  entity.UID = organisation.uid;
  entity.UKPRN = organisation.ukprn;
  entity.EstablishmentNumber = organisation.establishmentNumber;
  entity.Status = organisation.status.id;
  entity.ClosedOn = organisation.closedOn;
  entity.Address = organisation.address;
};

const search = async (criteria, pageNumber = 1, pageSize = 25) => {
  const offset = (pageNumber - 1) * pageSize;
  const result = await organisations.findAndCountAll({
    where: {
      [Op.or]: {
        name: {
          [Op.like]: `%${criteria}%`,
        },
        urn: {
          [Op.like]: `%${criteria}%`,
        },
        uid: {
          [Op.like]: `%${criteria}%`,
        },
        ukprn: {
          [Op.like]: `%${criteria}%`,
        },
      },
    },
    order: [
      ['name', 'ASC'],
    ],
    limit: pageSize,
    offset,
  });
  const orgEntities = result.rows;
  const orgs = orgEntities.map((entity) => {
    return {
      id: entity.id,
      name: entity.name,
      category: organisationCategory.find(c => c.id === entity.Category),
      type: establishmentTypes.find(c => c.id === entity.Type),
      urn: entity.URN,
      uid: entity.UID,
      ukprn: entity.UKPRN,
      establishmentNumber: entity.EstablishmentNumber,
      status: organisationStatus.find(c => c.id === entity.Status),
      closedOn: entity.ClosedOn,
      address: entity.Address,
    };
  });
  const totalNumberOfRecords = result.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    organisations: orgs,
    totalNumberOfPages,
    totalNumberOfRecords,
  };
};

const pagedList = async (pageNumber = 1, pageSize = 25) => {
  const offset = (pageNumber - 1) * pageSize;
  const result = await organisations.findAndCountAll({
    order: [
      ['name', 'ASC'],
    ],
    limit: pageSize,
    offset,
  });
  const orgEntities = result.rows;
  const orgs = orgEntities.map((entity) => {
    return {
      id: entity.id,
      name: entity.name,
      category: organisationCategory.find(c => c.id === entity.Category),
      type: establishmentTypes.find(c => c.id === entity.Type),
      urn: entity.URN,
      uid: entity.UID,
      ukprn: entity.UKPRN,
      establishmentNumber: entity.EstablishmentNumber,
      status: organisationStatus.find(c => c.id === entity.Status),
      closedOn: entity.ClosedOn,
      address: entity.Address,
    };
  });
  const totalNumberOfRecords = result.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    organisations: orgs,
    totalNumberOfPages,
    totalNumberOfRecords,
  };
};

const add = async (organisation) => {
  const entity = {
    id: organisation.id,
  };
  updateEntityFromOrganisation(entity, organisation);
  await organisations.create(entity);
};

const update = async (organisation) => {
  const existing = await organisations.find({
    where: {
      id:
        {
          [Op.eq]: organisation.id,
        },
    },
  });

  if (!existing) {
    throw new Error(`Cannot find organisation in database with id ${organisation.id}`);
  }

  updateEntityFromOrganisation(existing, organisation);
  await existing.save();
};

const listOfCategory = async (category, includeAssociations = false) => {
  const query = {
    where: {
      Category: {
        [Op.eq]: category,
      },
    },
    order: [
      ['name', 'ASC'],
    ],
  };
  if (includeAssociations) {
    query.include = ['associations'];
  }
  const orgEntities = await organisations.findAll(query);
  return orgEntities.map((entity) => {
    return {
      id: entity.id,
      name: entity.name,
      category: organisationCategory.find(c => c.id === entity.Category),
      type: establishmentTypes.find(c => c.id === entity.Type),
      urn: entity.URN,
      uid: entity.UID,
      ukprn: entity.UKPRN,
      establishmentNumber: entity.EstablishmentNumber,
      status: organisationStatus.find(c => c.id === entity.Status),
      closedOn: entity.ClosedOn,
      address: entity.Address,
    };
  });
};

const addAssociation = async (organisationId, associatedOrganisationId, linkType) => {
  const entity = {
    organisation_id: organisationId,
    associated_organisation_id: associatedOrganisationId,
    link_type: linkType,
  };
  await organisationAssociations.create(entity);
};

const removeAssociationsOfType = async (organisationId, linkType) => {
  await organisationAssociations.destroy({
    where: {
      organisation_id: {
        [Op.eq]: organisationId,
      },
      link_type: {
        [Op.eq]: linkType,
      },
    },
  });
};

const getOrganisationsForUser = async (userId) => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
    },
    include: ['Organisation'],
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  return await Promise.all(userOrgs.map(async (userOrg) => {
    const services = await users.findAll({
      where: {
        user_id: {
          [Op.eq]: userId,
        },
        organisation_id: {
          [Op.eq]: userOrg.organisation_id,
        },
      },
      include: ['Service'],
    });
    const role = await userOrg.getRole();
    const approvers = await userOrg.getApprovers().map(user => user.user_id);

    return {
      organisation: {
        id: userOrg.Organisation.getDataValue('id'),
        name: userOrg.Organisation.getDataValue('name'),
      },
      role,
      approvers,
      services: await Promise.all(services.map(async (service) => {
        const externalIdentifiers = await service.getExternalIdentifiers().map(extId => ({
          key: extId.identifier_key,
          value: extId.identifier_value,
        }));

        return {
          id: service.Service.getDataValue('id'),
          name: service.Service.getDataValue('name'),
          externalIdentifiers,
        };
      })),
    };
  }));
};

module.exports = {
  list,
  getOrgById,
  search,
  pagedList,
  add,
  update,
  listOfCategory,
  addAssociation,
  removeAssociationsOfType,
  getOrgByUrn,
  getOrgByUid,
  getOrganisationsForUser,
};
