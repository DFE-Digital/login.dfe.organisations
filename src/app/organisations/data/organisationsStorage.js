const logger = require('./../../../infrastructure/logger');
const { list, getOrgById } = require('./../../services/data/organisationsStorage');
const { organisations, organisationStatus, organisationCategory, establishmentTypes, organisationAssociations, userOrganisations, users, organisationUserStatus, regionCodes, phasesOfEducation } = require('./../../../infrastructure/repository');
const Sequelize = require('sequelize');
const uniq = require('lodash/uniq');

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
  entity.telephone = organisation.telephone;
  entity.regionCode = organisation.region ? organisation.region.id : null;
  entity.phaseOfEducation = organisation.phaseOfEducation ? organisation.phaseOfEducation.id : null;
  entity.statutoryLowAge = organisation.statutoryLowAge;
  entity.statutoryHighAge = organisation.statutoryHighAge;
  entity.legacyId = organisation.legacyId;
};
const updateOrganisationsWithLocalAuthorityDetails = async (orgs) => {
  const localAuthorityIds = uniq(orgs.filter(o => o.localAuthority).map(o => o.localAuthority.id));
  const localAuthorityEntities = await organisations.findAll({
    where: {
      id: {
        [Op.in]: localAuthorityIds,
      },
    },
  });
  localAuthorityEntities.forEach((laEntity) => {
    const localAuthority = {
      id: laEntity.id,
      name: laEntity.name,
      code: laEntity.EstablishmentNumber,
    };
    const laOrgs = orgs.filter(o => o.localAuthority && o.localAuthority.id === localAuthority.id);
    laOrgs.forEach((org) => org.localAuthority = localAuthority);
  });
};
const mapOrganisationFromEntity = (entity) => {
  if (!entity) {
    return null;
  }

  const laAssociation = entity.associations ? entity.associations.find(a => a.link_type === 'LA') : undefined;

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
    telephone: entity.telephone,
    region: regionCodes.find(c => c.id === entity.regionCode),
    localAuthority: laAssociation ? {
      id: laAssociation.associated_organisation_id,
    } : undefined,
    phaseOfEducation: phasesOfEducation.find(c => c.id === entity.phaseOfEducation),
    statutoryLowAge: entity.statutoryLowAge,
    statutoryHighAge: entity.statutoryHighAge,
    legacyId: entity.legacyId,
  };
};

const search = async (criteria, pageNumber = 1, pageSize = 25, filterCategories = undefined, filterStates = undefined) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
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
    include: ['associations'],
    limit: pageSize,
    offset,
  };

  if (filterCategories && filterCategories.length > 0) {
    query.where.Category = {
      [Op.in]: filterCategories,
    };
  }

  if (filterStates && filterStates.length > 0) {
    query.where.Status = {
      [Op.in]: filterStates,
    };
  }

  const result = await organisations.findAndCountAll(query);
  const orgEntities = result.rows;
  const orgs = orgEntities.map(mapOrganisationFromEntity);
  await updateOrganisationsWithLocalAuthorityDetails(orgs);

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
    include: ['associations'],
    limit: pageSize,
    offset,
  });
  const orgEntities = result.rows;
  const orgs = orgEntities.map((entity) => {
    const laAssociation = entity.associations.find(a => a.link_type === 'LA');

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
      telephone: entity.telephone,
      region: regionCodes.find(c => c.id === entity.regionCode),
      localAuthority: laAssociation ? {
        id: laAssociation.associated_organisation_id,
      } : undefined,
      phaseOfEducation: phasesOfEducation.find(c => c.id === entity.phaseOfEducation),
      statutoryLowAge: entity.statutoryLowAge,
      statutoryHighAge: entity.statutoryHighAge,
      legacyId: entity.legacyId,
    };
  });
  await updateOrganisationsWithLocalAuthorityDetails(orgs);

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
  return orgEntities.map(entity => ({
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
    legacyId: entity.legacyId,
  }));
};

const pagedListOfCategory = async (category, includeAssociations = false, pageNumber = 1, pageSize = 25) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {
      Category: {
        [Op.eq]: category,
      },
    },
    order: [
      ['name', 'ASC'],
    ],
    limit: pageSize,
    offset,
  };
  if (includeAssociations) {
    query.include = ['associations'];
  }

  const result = await organisations.findAndCountAll(query);
  const orgs = result.rows.map((entity) => {
    const organisation = {
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
      telephone: entity.telephone,
      region: regionCodes.find(c => c.id === entity.regionCode),
      phaseOfEducation: phasesOfEducation.find(c => c.id === entity.phaseOfEducation),
      statutoryLowAge: entity.statutoryLowAge,
      statutoryHighAge: entity.statutoryHighAge,
      legacyId: entity.legacyId,
    };

    if (entity.associations) {
      organisation.associations = entity.associations.map((assEntity) => ({
        associatedOrganisationId: assEntity.associated_organisation_id,
        associationType: assEntity.link_type,
      }));
    }

    return organisation;
  });

  const totalNumberOfRecords = result.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    organisations: orgs,
    totalNumberOfPages,
    totalNumberOfRecords,
  };
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
    order: [
      ['Organisation', 'name', 'ASC'],
    ],
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
        urn: userOrg.Organisation.getDataValue('URN') || undefined,
        uid: userOrg.Organisation.getDataValue('UID') || undefined,
        ukprn: userOrg.Organisation.getDataValue('UKPRN') || undefined,
        category: organisationCategory.find(c => c.id === userOrg.Organisation.getDataValue('Category')),
        type: establishmentTypes.find(t => t.id === userOrg.Organisation.getDataValue('Type')),
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
          description: service.Service.getDataValue('description'),
          externalIdentifiers,
          requestDate: service.getDataValue('createdAt'),
          status: service.getDataValue('status'),
        };
      })),
    };
  }));
};

const setUserAccessToOrganisation = async (organisationId, userId, roleId, status, reason) => userOrganisations.upsert({
  user_id: userId.toUpperCase(),
  organisation_id: organisationId,
  role_id: roleId,
  status,
  reason,
});

const getOrganisationCategories = async () => {
  const categories = organisationCategory.sort((x, y) => {
    if (x.name < y.name) {
      return -1;
    }
    if (x.name > y.name) {
      return 1;
    }
    return 0;
  });
  return Promise.resolve(categories);
};

const getOrganisationStates = async () => {
  const categories = organisationStatus.sort((x, y) => {
    if (x.name < y.name) {
      return -1;
    }
    if (x.name > y.name) {
      return 1;
    }
    return 0;
  });
  return Promise.resolve(categories);
};

const getUsersPendingApprovalByUser = async (userId) => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
      role_id: {
        [Op.eq]: 10000,
      },
      status: {
        [Op.eq]: 1,
      },
    },
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  const associatedUsersForApproval = await userOrganisations.findAll({
    where: {
      organisation_id: {
        [Op.in]: userOrgs.map(c => c.organisation_id),
      },
      status: {
        [Op.eq]: 0,
      },
      user_id: {
        [Op.ne]: userId,
      },
    },
    include: ['Organisation'],
  });

  if (!associatedUsersForApproval || associatedUsersForApproval.length === 0) {
    return [];
  }

  return associatedUsersForApproval.map(entity => ({
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationUserStatus.find(c => c.id === entity.getDataValue('status')),
  }));
};

const getUsersPendingApproval = async (pageNumber = 1, pageSize = 25) => {
  const offset = (pageNumber - 1) * pageSize;
  const associatedUsersForApproval = await userOrganisations.findAndCountAll({
    where: {
      status: {
        [Op.eq]: 0,
      },
    },
    limit: pageSize,
    offset,
    include: ['Organisation'],
  });

  if (!associatedUsersForApproval || associatedUsersForApproval.length === 0) {
    return [];
  }
  const totalNumberOfRecords = associatedUsersForApproval.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  const usersForApproval = associatedUsersForApproval.rows.map(entity => ({
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    org_address: entity.Organisation.getDataValue('Address'),
    category: organisationCategory.find(c => c.id === entity.Organisation.getDataValue('Category')),
    urn: entity.Organisation.getDataValue('URN'),
    uid: entity.Organisation.getDataValue('UID'),
    ukprn: entity.Organisation.getDataValue('UKPRN'),
    status: organisationUserStatus.find(c => c.id === entity.getDataValue('status')),
  }));

  return {
    usersForApproval,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const getOrgByUrn = async (urn) => {
  try {
    const entity = await organisations.findOne(
      {
        where: {
          URN: {
            [Op.eq]: urn,
          },
        },
      });
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by urn - ${e.message}`, e);
    throw e;
  }
};

const getOrgByUid = async (uid) => {
  try {
    const entity = await organisations.findOne(
      {
        where: {
          UID: {
            [Op.eq]: uid,
          },
        },
      });
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by uid - ${e.message}`, e);
    throw e;
  }
};

const getOrgByEstablishmentNumber = async (establishmentNumber) => {
  try {
    const entity = await organisations.findOne(
      {
        where: {
          EstablishmentNumber: {
            [Op.eq]: establishmentNumber,
          },
        },
      });
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by establishment number - ${e.message}`, e);
    throw e;
  }
};

const getOrgByUkprn = async (ukprn) => {
  try {
    const entity = await organisations.findOne(
      {
        where: {
          UKPRN: {
            [Op.eq]: ukprn,
          },
        },
      });
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by UKPRN - ${e.message}`, e);
    throw e;
  }
};

const getOrgByLegacyId = async (legacyId) => {
  try {
    const entity = await organisations.findOne(
      {
        where: {
          legacyId: {
            [Op.eq]: legacyId,
          },
        },
      });
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by legacy id - ${e.message}`, e);
    throw e;
  }
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
  getOrgByEstablishmentNumber,
  getOrgByUkprn,
  getOrgByLegacyId,
  getOrganisationsForUser,
  setUserAccessToOrganisation,
  getOrganisationCategories,
  getOrganisationStates,
  getUsersPendingApprovalByUser,
  getUsersPendingApproval,
  pagedListOfCategory,
};
