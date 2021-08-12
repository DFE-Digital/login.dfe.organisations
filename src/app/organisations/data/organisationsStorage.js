const logger = require('./../../../infrastructure/logger');
const {
  organisations,
  organisationStatus,
  organisationCategory,
  establishmentTypes,
  organisationAssociations,
  userOrganisations,
  invitationOrganisations,
  users,
  organisationUserStatus,
  regionCodes,
  phasesOfEducation,
  counters,
  organisationAnnouncements,
  userOrganisationRequests,
  organisationRequestStatus,
  getNextNumericId,
  getNextLegacyId
} = require('./../../../infrastructure/repository');
const Sequelize = require('sequelize');
const { uniq, trim } = require('lodash');
const { mapAsync } = require('./../../../utils');
const uuid = require('uuid/v4');

const Op = Sequelize.Op;

const updateIfValid = (oldValue, newValue) => {
  const trimmedNewValue = trim(newValue);
  return trimmedNewValue || oldValue;
};

const updateEntityFromOrganisation = (entity, organisation) => {
  entity.name = organisation.name;
  entity.Category = organisation.category.id;
  entity.Type = organisation.type ? organisation.type.id : null;
  entity.URN = updateIfValid(entity.URN, organisation.urn);
  entity.UID = organisation.uid;
  entity.UKPRN = updateIfValid(entity.UKPRN, organisation.ukprn);
  entity.EstablishmentNumber = organisation.establishmentNumber;
  entity.Status = organisation.status.id;
  entity.ClosedOn = organisation.closedOn;
  entity.Address = organisation.address;
  entity.telephone = organisation.telephone;
  entity.regionCode = organisation.region ? organisation.region.id : null;
  entity.phaseOfEducation = organisation.phaseOfEducation
    ? organisation.phaseOfEducation.id
    : null;
  entity.statutoryLowAge = organisation.statutoryLowAge;
  entity.statutoryHighAge = organisation.statutoryHighAge;
  entity.legacyId = organisation.legacyId;
  entity.companyRegistrationNumber = organisation.companyRegistrationNumber;
};
const updateOrganisationsWithLocalAuthorityDetails = async orgs => {
  const localAuthorityIds = uniq(
    orgs.filter(o => o.localAuthority).map(o => o.localAuthority.id)
  );
  const localAuthorityEntities = await organisations.findAll({
    where: {
      id: {
        [Op.in]: localAuthorityIds
      }
    }
  });
  localAuthorityEntities.forEach(laEntity => {
    const localAuthority = {
      id: laEntity.id,
      name: laEntity.name,
      code: laEntity.EstablishmentNumber
    };
    const laOrgs = orgs.filter(
      o => o.localAuthority && o.localAuthority.id === localAuthority.id
    );
    laOrgs.forEach(org => (org.localAuthority = localAuthority));
  });
};
const mapOrganisationFromEntity = entity => {
  if (!entity) {
    return null;
  }

  const laAssociation = entity.associations
    ? entity.associations.find(a => a.link_type === 'LA')
    : undefined;

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
    localAuthority: laAssociation
      ? {
          id: laAssociation.associated_organisation_id
        }
      : undefined,
    phaseOfEducation: phasesOfEducation.find(
      c => c.id === entity.phaseOfEducation
    ),
    statutoryLowAge: entity.statutoryLowAge,
    statutoryHighAge: entity.statutoryHighAge,
    legacyId: entity.legacyId,
    companyRegistrationNumber: entity.companyRegistrationNumber
  };
};
const mapAnnouncementFromEntity = entity => {
  return {
    id: entity.announcement_id,
    originId: entity.origin_id,
    organisationId: entity.organisation_id,
    type: entity.type,
    title: entity.title,
    summary: entity.summary,
    body: entity.body,
    publishedAt: entity.publishedAt,
    expiresAt: entity.expiresAt,
    published: entity.published
  };
};

const list = async(includeAssociations = false) => {
  try {
    const findOrgsOpts = {};
    if (includeAssociations) {
      findOrgsOpts.include = ['associations'];
    }
    const orgEntities = await organisations.findAll(findOrgsOpts);
    if (!orgEntities) {
      return null;
    }

    return await Promise.all(
      orgEntities.map(async serviceEntity => {
        const organisation = {
          id: serviceEntity.getDataValue('id'),
          name: serviceEntity.getDataValue('name'),
          category: organisationCategory.find(
            c => c.id === serviceEntity.Category
          ),
          type: establishmentTypes.find(c => c.id === serviceEntity.Type),
          urn: serviceEntity.URN,
          uid: serviceEntity.UID,
          ukprn: serviceEntity.UKPRN,
          establishmentNumber: serviceEntity.EstablishmentNumber,
          status: organisationStatus.find(c => c.id === serviceEntity.Status),
          closedOn: serviceEntity.ClosedOn,
          address: serviceEntity.Address
        };

        if (serviceEntity.associations) {
          organisation.associations = serviceEntity.associations.map(
            assEntity => ({
              associatedOrganisationId: assEntity.associated_organisation_id,
              associationType: assEntity.link_type
            })
          );
        }

        return organisation;
      })
    );
  } catch (e) {
    logger.error(`error getting organisations - ${e.message}`, e);
    throw e;
  }
};

const getOrgById = async id => {
  const entity = await organisations.findOne({
    where: {
      id: {
        [Op.eq]: id
      }
    },
    include: ['associations']
  });
  const org = mapOrganisationFromEntity(entity);
  if (org) {
    await updateOrganisationsWithLocalAuthorityDetails([org]);
  }
  return org;
};

const pagedSearch = async(
  criteria,
  pageNumber = 1,
  pageSize = 25,
  filterCategories = [],
  filterStates = [],
  filterOutOrgNames = []
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {},
    order: [['name', 'ASC']],
    include: ['associations'],
    distinct: true,
    limit: pageSize,
    offset
  };

  if (criteria && criteria !== undefined) {
    query.where = {
      [Op.or]: {
        name: {
          [Op.like]: `%${criteria}%`
        },
        urn: {
          [Op.like]: `%${criteria}%`
        },
        uid: {
          [Op.like]: `%${criteria}%`
        },
        ukprn: {
          [Op.like]: `%${criteria}%`
        },
        establishmentNumber: {
          [Op.like]: `%${criteria}%`
        },
        legacyId: {
          [Op.like]: `%${criteria}%`
        }
      }
    };
  }

  if (filterOutOrgNames.length > 0) {
    query.where.name = {
      [Op.notIn]: filterOutOrgNames
    };
  }

  if (filterCategories.length > 0) {
    query.where.Category = {
      [Op.in]: filterCategories
    };
  }

  if (filterStates.length > 0) {
    query.where.Status = {
      [Op.in]: filterStates
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
    totalNumberOfRecords
  };
};

const add = async organisation => {
  const entity = {
    id: organisation.id
  };
  updateEntityFromOrganisation(entity, organisation);
  await organisations.create(entity);
};

const update = async organisation => {
  const existing = await organisations.findOne({
    where: {
      id: {
        [Op.eq]: organisation.id
      }
    }
  });

  if (!existing) {
    throw new Error(
      `Cannot find organisation in database with id ${organisation.id}`
    );
  }

  updateEntityFromOrganisation(existing, organisation);
  await existing.save();
};

const listOfCategory = async(category, includeAssociations = false) => {
  const query = {
    where: {
      Category: {
        [Op.eq]: category
      }
    },
    order: [['name', 'ASC']]
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
    companyRegistrationNumber: entity.companyRegistrationNumber
  }));
};

const pagedListOfCategory = async(
  category,
  includeAssociations = false,
  pageNumber = 1,
  pageSize = 25
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {
      Category: {
        [Op.eq]: category
      }
    },
    order: [
      ['name', 'ASC'],
      ['id', 'ASC']
    ],
    limit: pageSize,
    offset
  };
  if (includeAssociations) {
    query.include = ['associations'];
  }

  const result = await organisations.findAndCountAll(query);
  const orgs = result.rows.map(entity => {
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
      phaseOfEducation: phasesOfEducation.find(
        c => c.id === entity.phaseOfEducation
      ),
      statutoryLowAge: entity.statutoryLowAge,
      statutoryHighAge: entity.statutoryHighAge,
      legacyId: entity.legacyId,
      companyRegistrationNumber: entity.companyRegistrationNumber
    };

    if (entity.associations) {
      organisation.associations = entity.associations.map(assEntity => ({
        associatedOrganisationId: assEntity.associated_organisation_id,
        associationType: assEntity.link_type
      }));
    }

    return organisation;
  });

  const totalNumberOfRecords = result.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    organisations: orgs,
    totalNumberOfPages,
    totalNumberOfRecords
  };
};

const addAssociation = async(
  organisationId,
  associatedOrganisationId,
  linkType
) => {
  const entity = {
    organisation_id: organisationId,
    associated_organisation_id: associatedOrganisationId,
    link_type: linkType
  };
  await organisationAssociations.create(entity);
};

const removeAssociationsOfType = async(organisationId, linkType) => {
  await organisationAssociations.destroy({
    where: {
      organisation_id: {
        [Op.eq]: organisationId
      },
      link_type: {
        [Op.eq]: linkType
      }
    }
  });
};

// Deprecated
const getOrganisationsForUserIncludingServices = async userId => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId
      }
    },
    include: ['Organisation'],
    order: [['Organisation', 'name', 'ASC']]
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  return await Promise.all(
    userOrgs.map(async userOrg => {
      const services = await users.findAll({
        where: {
          user_id: {
            [Op.eq]: userId
          },
          organisation_id: {
            [Op.eq]: userOrg.organisation_id
          }
        },
        include: ['Service']
      });
      const role = await userOrg.getRole();
      const approvers = (await userOrg.getApprovers()).map(user => user.user_id);

      return {
        organisation: {
          id: userOrg.Organisation.getDataValue('id'),
          name: userOrg.Organisation.getDataValue('name'),
          urn: userOrg.Organisation.getDataValue('URN') || undefined,
          uid: userOrg.Organisation.getDataValue('UID') || undefined,
          ukprn: userOrg.Organisation.getDataValue('UKPRN') || undefined,
          address: userOrg.Organisation.getDataValue('Address') || undefined,
          status:
            organisationStatus.find(
              c => c.id === userOrg.Organisation.getDataValue('Status')
            ) || undefined,
          legacyUserId: userOrg.numeric_identifier || undefined,
          legacyUserName: userOrg.text_identifier || undefined,
          category: organisationCategory.find(
            c => c.id === userOrg.Organisation.getDataValue('Category')
          ),
          type: establishmentTypes.find(
            t => t.id === userOrg.Organisation.getDataValue('Type')
          ),
          companyRegistrationNumber:
            userOrg.Organisation.companyRegistrationNumber
        },
        role,
        approvers,
        services: await Promise.all(
          services.map(async service => {
            const externalIdentifiers = (await service
              .getExternalIdentifiers())
              .map(extId => ({
                key: extId.identifier_key,
                value: extId.identifier_value
              }));

            return {
              id: service.Service.getDataValue('id'),
              name: service.Service.getDataValue('name'),
              description: service.Service.getDataValue('description'),
              externalIdentifiers,
              requestDate: service.getDataValue('createdAt'),
              status: service.getDataValue('status')
            };
          })
        ),
        numericIdentifier: userOrg.numeric_identifier || undefined,
        textIdentifier: userOrg.text_identifier || undefined
      };
    })
  );
};

const getOrganisationsAssociatedToUser = async userId => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId
      }
    },
    // include: ['Organisation'],
    include: [
      {
        model: organisations,
        as: 'Organisation',
        include: 'associations'
      }
    ],
    order: [['Organisation', 'name', 'ASC']]
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  return mapAsync(userOrgs, async userOrg => {
    const role = await userOrg.getRole();
    const approvers = (await userOrg.getApprovers()).map(user => user.user_id);
    const organisation = await mapOrganisationFromEntity(userOrg.Organisation);
    await updateOrganisationsWithLocalAuthorityDetails([organisation]);

    return {
      organisation,
      role,
      approvers,
      numericIdentifier: userOrg.numeric_identifier || undefined,
      textIdentifier: userOrg.text_identifier || undefined
    };
  });
};

const setUserAccessToOrganisation = async(
  organisationId,
  userId,
  roleId,
  status,
  reason,
  numericIdentifier,
  textIdentifier
) =>
  userOrganisations.upsert({
    user_id: userId.toUpperCase(),
    organisation_id: organisationId,
    role_id: roleId,
    status,
    reason,
    numeric_identifier: numericIdentifier,
    text_identifier: textIdentifier
  });

const deleteUserOrganisation = async(
  organisationId,
  userId,
  correlationId
) => {
  try {
    logger.info(
      `Deleting org ${organisationId} for user ${userId} for ${correlationId}`,
      { correlationId }
    );
    await userOrganisations.destroy({
      where: {
        user_id: {
          [Op.eq]: userId
        },
        organisation_id: {
          [Op.eq]: organisationId
        }
      }
    });
  } catch (e) {
    logger.error(
      `error deleting organisation for user- ${e.message} (id: ${correlationId})`,
      { correlationId }
    );
    throw e;
  }
};

const getOrganisationCategories = async() => {
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

const getOrganisationStates = async() => {
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

const getUsersPendingApprovalByUser = async userId => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId
      },
      role_id: {
        [Op.eq]: 10000
      },
      status: {
        [Op.eq]: 1
      }
    }
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  const associatedUsersForApproval = await userOrganisations.findAll({
    where: {
      organisation_id: {
        [Op.in]: userOrgs.map(c => c.organisation_id)
      },
      status: {
        [Op.eq]: 0
      },
      user_id: {
        [Op.ne]: userId
      }
    },
    include: ['Organisation']
  });

  if (!associatedUsersForApproval || associatedUsersForApproval.length === 0) {
    return [];
  }

  return associatedUsersForApproval.map(entity => ({
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationUserStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  }));
};

const getUsersPendingApproval = async(pageNumber = 1, pageSize = 25) => {
  const offset = (pageNumber - 1) * pageSize;
  const associatedUsersForApproval = await userOrganisations.findAndCountAll({
    where: {
      status: {
        [Op.eq]: 0
      }
    },
    limit: pageSize,
    offset,
    include: ['Organisation']
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
    category: organisationCategory.find(
      c => c.id === entity.Organisation.getDataValue('Category')
    ),
    urn: entity.Organisation.getDataValue('URN'),
    uid: entity.Organisation.getDataValue('UID'),
    ukprn: entity.Organisation.getDataValue('UKPRN'),
    status: organisationUserStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  }));

  return {
    usersForApproval,
    totalNumberOfRecords,
    totalNumberOfPages
  };
};

const getOrgByUrn = async(urn, category) => {
  try {
    const query = {
      where: {
        URN: {
          [Op.eq]: urn
        }
      }
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by urn - ${e.message}`, e);
    throw e;
  }
};

const getOrgByUid = async(uid, category) => {
  try {
    const query = {
      where: {
        UID: {
          [Op.eq]: uid
        }
      }
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by uid - ${e.message}`, e);
    throw e;
  }
};

const getOrgByEstablishmentNumber = async(establishmentNumber, category) => {
  try {
    const query = {
      where: {
        EstablishmentNumber: {
          [Op.eq]: establishmentNumber
        }
      }
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(
      `error getting organisation by establishment number - ${e.message}`,
      e
    );
    throw e;
  }
};

const getOrgByUkprn = async(ukprn, category) => {
  try {
    const query = {
      where: {
        UKPRN: {
          [Op.eq]: ukprn
        }
      }
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by UKPRN - ${e.message}`, e);
    throw e;
  }
};

const getAllOrgsByUkprn = async(ukprn, category) => {
  try {
    const query = {
      where: {
        UKPRN: {
          [Op.eq]: ukprn
        }
      }
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category
      };
    }
    const orgEntities = await organisations.findAll(query);
    return orgEntities.map(mapOrganisationFromEntity);
  } catch (e) {
    logger.error(`error getting organisations by UKPRN - ${e.message}`, e);
    throw e;
  }
};

const getOrgByLegacyId = async(legacyId, category) => {
  try {
    const query = {
      where: {
        legacyId: {
          [Op.eq]: legacyId
        }
      }
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by legacy id - ${e.message}`, e);
    throw e;
  }
};

const getUsersAssociatedWithOrganisation = async(
  orgId,
  pageNumber = 1,
  pageSize = 25
) => {
  const offset = (pageNumber - 1) * pageSize;
  const userOrgs = await userOrganisations.findAndCountAll({
    where: {
      organisation_id: {
        [Op.eq]: orgId
      }
    },
    limit: pageSize,
    offset
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }
  const totalNumberOfRecords = userOrgs.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  return await Promise.all(
    userOrgs.rows.map(async userOrgEntity => {
      const role = await userOrgEntity.getRole();
      return {
        id: userOrgEntity.getDataValue('user_id'),
        status: userOrgEntity.getDataValue('status'),
        role,
        numericIdentifier: userOrgEntity.numeric_identifier || undefined,
        textIdentifier: userOrgEntity.text_identifier || undefined,
        totalNumberOfPages
      };
    })
  );
};

const pagedListOfUsers = async(pageNumber = 1, pageSize = 25) => {
  const recordset = await userOrganisations.findAndCountAll({
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ['Organisation']
  });
  const mappings = [];
  for (let i = 0; i < recordset.rows.length; i += 1) {
    const entity = recordset.rows[i];
    const role = await entity.getRole();
    const organisation = mapOrganisationFromEntity(entity.Organisation);
    await updateOrganisationsWithLocalAuthorityDetails([organisation]);

    mappings.push({
      userId: entity.user_id,
      organisation,
      role,
      status: entity.status,
      numericIdentifier: entity.numeric_identifier || undefined,
      textIdentifier: entity.text_identifier || undefined
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    userOrganisations: mappings,
    totalNumberOfRecords,
    totalNumberOfPages
  };
};

const getPagedListOfUsersV2 = async(
  pageNumber = 1,
  pageSize = 25,
  roleId = undefined,
  filterTypes = undefined,
  filterStatus = undefined
) => {
  const query = {
    where: {},
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ['Organisation']
  };

  if (roleId !== undefined) {
    query.where.role_id = {
      [Op.eq]: roleId
    };
  }
  if (filterTypes && filterTypes.length > 0) {
    query.where['$Organisation.type$'] = {
      [Op.in]: filterTypes
    };
  }

  if (filterStatus && filterStatus.length > 0) {
    query.where['$Organisation.status$'] = {
      [Op.in]: filterStatus
    };
  }

  const recordset = await userOrganisations.findAndCountAll(query);
  const mappings = [];
  for (let i = 0; i < recordset.rows.length; i += 1) {
    const entity = recordset.rows[i];
    const role = await entity.getRole();
    const organisation = mapOrganisationFromEntity(entity.Organisation);
    await updateOrganisationsWithLocalAuthorityDetails([organisation]);

    mappings.push({
      userId: entity.user_id,
      organisation,
      role,
      status: entity.status,
      numericIdentifier: entity.numeric_identifier || undefined,
      textIdentifier: entity.text_identifier || undefined
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    users: mappings,
    page: pageNumber,
    totalNumberOfRecords,
    totalNumberOfPages
  };
};

const getPagedListOfUsersV3 = async(
  pageNumber = 1,
  pageSize = 25,
  roleId = undefined,
  policies = undefined
) => {
  const query = {
    where: {},
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ['Organisation']
  };

  if (roleId !== undefined) {
    query.where.role_id = {
      [Op.eq]: roleId
    };
  }

  const allPolicyQueries = [];

  policies.forEach((policy) => {
    if (policy.conditions && policy.conditions.length) {
      const singlePolicyQueries = [];

      policy.conditions.forEach((condition) => {
        let fieldForQuery;
        let operator;

        // get the actual field based on the condition
        switch (condition.field) {
          case 'organisation.type.id':
            fieldForQuery = '$Organisation.type$';
            break;
          case 'organisation.status.id':
            fieldForQuery = '$Organisation.status$';
            break;
          case 'organisation.category.id':
            fieldForQuery = '$Organisation.category$';
            break;
          case 'organisation.phaseOfEducation.id':
            fieldForQuery = '$Organisation.phaseOfEducation$';
            break;
          case 'organisation.ukprn':
            fieldForQuery = '$Organisation.ukprn$';
            break;
          case 'id':
            fieldForQuery = '$user_id$';
            break;
          default:
            break;
        }

        // get the operator based on the condition
        switch (condition.operator) {
          case 'is':
            operator = Op.in;
            break;
          case 'is not':
            operator = Op.notIn;
            break;
          default:
            break;
        }

        // build the query for this condition
        if (fieldForQuery && operator) {
          singlePolicyQueries.push({ [fieldForQuery]: { [operator]: condition.value } });
        }
      });

      if (singlePolicyQueries.length) {
        allPolicyQueries.push(singlePolicyQueries);
      }
    }
  });

  if (allPolicyQueries.length) {
    query.where[Op.or] = allPolicyQueries;
  }

  const recordset = await userOrganisations.findAndCountAll(query);
  const mappings = [];
  for (const entity of recordset.rows) {
    const role = await entity.getRole();
    const organisation = mapOrganisationFromEntity(entity.Organisation);
    await updateOrganisationsWithLocalAuthorityDetails([organisation]);

    mappings.push({
      userId: entity.user_id,
      organisation,
      role,
      status: entity.status,
      numericIdentifier: entity.numeric_identifier || undefined,
      textIdentifier: entity.text_identifier || undefined
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    users: mappings,
    page: pageNumber,
    totalNumberOfRecords,
    totalNumberOfPages
  };
};

const pagedListOfInvitations = async(pageNumber = 1, pageSize = 25) => {
  const recordset = await invitationOrganisations.findAndCountAll({
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ['Organisation']
  });
  const mappings = [];
  for (let i = 0; i < recordset.rows.length; i += 1) {
    const entity = recordset.rows[i];
    const role = await entity.getRole();
    const organisation = mapOrganisationFromEntity(entity.Organisation);
    await updateOrganisationsWithLocalAuthorityDetails([organisation]);

    mappings.push({
      invitationId: entity.invitation_id,
      organisation,
      role
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    invitationOrganisations: mappings,
    totalNumberOfRecords,
    totalNumberOfPages
  };
};

const getUserOrganisationByTextIdentifier = async textIdentifier => {
  const entity = await userOrganisations.findOne({
    where: {
      text_identifier: {
        [Op.eq]: textIdentifier
      }
    }
  });
  return entity || undefined;
};

const getNextUserOrgNumericIdentifier = async() => {
  const NUMERIC_ID = await getNextNumericId();
  return NUMERIC_ID;
};

const getNextOrganisationLegacyId = async() => {
  const LEGACY_ID = await getNextLegacyId();
  return LEGACY_ID;
};

const listAnnouncements = async(
  organisationId = undefined,
  originId = undefined,
  onlyPublishedAnnouncements = true,
  pageNumber = 1,
  pageSize = 25
) => {
  const where = {};
  if (onlyPublishedAnnouncements) {
    where.published = {
      [Op.eq]: true
    };
  }
  if (organisationId) {
    where.organisation_id = {
      [Op.eq]: organisationId
    };
  }
  if (originId) {
    where.origin_id = {
      [Op.eq]: originId
    };
  }
  const recordset = await organisationAnnouncements.findAndCountAll({
    where,
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize
  });

  const totalNumberOfRecords = recordset.count;
  const numberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    announcements: recordset.rows.map(mapAnnouncementFromEntity),
    page: pageNumber,
    numberOfPages,
    totalNumberOfRecords
  };
};

const upsertAnnouncement = async(
  originId,
  organisationId,
  type,
  title,
  summary,
  body,
  publishedAt,
  expiresAt,
  published
) => {
  let entity = await organisationAnnouncements.findOne({
    where: {
      origin_id: {
        [Op.eq]: originId
      }
    }
  });
  if (entity) {
    entity.type = type;
    entity.title = title;
    entity.summary = summary;
    entity.body = body;
    entity.publishedAt = publishedAt;
    entity.expiresAt = expiresAt;
    entity.published = published;
    await entity.save();
    return mapAnnouncementFromEntity(entity);
  }

  entity = {
    announcement_id: uuid(),
    origin_id: originId,
    organisation_id: organisationId,
    type,
    title,
    summary,
    body,
    publishedAt,
    expiresAt,
    published
  };
  await organisationAnnouncements.create(entity);
  return mapAnnouncementFromEntity(entity);
};

const getApproversForOrg = async organisationId => {
  const entites = await userOrganisations.findAll({
    where: {
      organisation_id: {
        [Op.eq]: organisationId
      },
      role_id: {
        [Op.eq]: 10000
      }
    }
  });
  return await Promise.all(
    entites.map(async approver => approver.getDataValue('user_id'))
  );
};

const createUserOrgRequest = async request => {
  const id = uuid();
  const entity = {
    id,
    user_id: request.userId.toUpperCase(),
    organisation_id: request.organisationId,
    reason: request.reason,
    status: request.status || 0
  };
  await userOrganisationRequests.create(entity);
  return id;
};

const getUserOrgRequestById = async rid => {
  const entity = await userOrganisationRequests.findOne({
    where: {
      id: {
        [Op.eq]: rid
      }
    },
    include: ['Organisation']
  });
  return {
    id: entity.get('id'),
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    actioned_date: entity.getDataValue('actioned_at'),
    actioned_by: entity.getDataValue('actioned_by'),
    actioned_reason: entity.getDataValue('actioned_reason'),
    reason: entity.getDataValue('reason'),
    status: organisationRequestStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  };
};

const getAllPendingRequestsForApprover = async userId => {
  const userApproverOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId
      },
      role_id: {
        [Op.eq]: 10000
      }
    }
  });
  if (!userApproverOrgs || userApproverOrgs.length === 0) {
    return [];
  }

  const requestsForUsersOrgs = await userOrganisationRequests.findAll({
    where: {
      organisation_id: {
        [Op.in]: userApproverOrgs.map(c => c.organisation_id)
      },
      status: {
        [Op.or]: [0, 2, 3]
      }
    },
    include: ['Organisation']
  });

  if (!requestsForUsersOrgs || requestsForUsersOrgs.length === 0) {
    return [];
  }
  return requestsForUsersOrgs.map(entity => ({
    id: entity.get('id'),
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationRequestStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  }));
};

const getRequestsAssociatedWithOrganisation = async orgId => {
  const userOrgRequests = await userOrganisationRequests.findAll({
    where: {
      organisation_id: {
        [Op.eq]: orgId
      },
      status: {
        [Op.or]: [0, 2, 3]
      }
    },
    include: ['Organisation']
  });
  if (!userOrgRequests || userOrgRequests.length === 0) {
    return [];
  }

  return userOrgRequests.map(entity => ({
    id: entity.get('id'),
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationRequestStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  }));
};

const pagedListOfRequests = async(
  pageNumber = 1,
  pageSize = 25,
  filterStates = undefined
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {},
    limit: pageSize,
    offset,
    order: [['createdAt', 'ASC']],
    include: ['Organisation']
  };

  if (filterStates && filterStates.length > 0) {
    query.where.status = {
      [Op.in]: filterStates
    };
  }
  const userOrgRequests = await userOrganisationRequests.findAndCountAll(query);
  if (!userOrgRequests || userOrgRequests.length === 0) {
    return [];
  }
  const totalNumberOfRecords = userOrgRequests.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  const requests = userOrgRequests.rows.map(entity => ({
    id: entity.get('id'),
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationRequestStatus.find(
      c => c.id === entity.getDataValue('status')
    ),
    reason: entity.getDataValue('reason')
  }));

  return {
    requests,
    totalNumberOfRecords,
    totalNumberOfPages
  };
};

const updateUserOrgRequest = async(requestId, request) => {
  const existingRequest = await userOrganisationRequests.findOne({
    where: {
      id: {
        [Op.eq]: requestId
      }
    }
  });

  if (!existingRequest) {
    return null;
  }

  const updatedRequest = Object.assign(existingRequest, request);

  await existingRequest.update({
    status: updatedRequest.status,
    actioned_by: updatedRequest.actioned_by,
    actioned_reason: updatedRequest.actioned_reason,
    actioned_at: updatedRequest.actioned_at
  });
};

const getRequestsAssociatedWithUser = async userId => {
  const userRequests = await userOrganisationRequests.findAll({
    where: {
      user_id: {
        [Op.eq]: userId
      },
      status: {
        [Op.or]: [0, 2, 3]
      }
    },
    include: ['Organisation']
  });
  if (!userRequests || userRequests.length === 0) {
    return [];
  }
  return userRequests.map(entity => ({
    id: entity.get('id'),
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    urn: entity.Organisation.getDataValue('URN'),
    uid: entity.Organisation.getDataValue('UID'),
    ukprn: entity.Organisation.getDataValue('UKPRN'),
    org_status:
      organisationStatus.find(
        c => c.id === entity.Organisation.getDataValue('Status')
      ) || undefined,
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationRequestStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  }));
};

const getLatestActionedRequestAssociated = async userId => {
  const entity = await userOrganisationRequests.findOne({
    where: {
      user_id: {
        [Op.eq]: userId
      },
      status: {
        [Op.or]: [-1, 0, 2, 3, 1]
      }
    },
    order: [['actioned_at', 'DESC']],
    include: ['Organisation']
  });
  if (!entity) {
    return null;
  }
  return {
    id: entity.get('id'),
    org_id: entity.Organisation.getDataValue('id'),
    org_name: entity.Organisation.getDataValue('name'),
    urn: entity.Organisation.getDataValue('URN'),
    uid: entity.Organisation.getDataValue('UID'),
    ukprn: entity.Organisation.getDataValue('UKPRN'),
    org_status:
      organisationStatus.find(
        c => c.id === entity.Organisation.getDataValue('Status')
      ) || undefined,
    user_id: entity.getDataValue('user_id'),
    created_date: entity.getDataValue('createdAt'),
    status: organisationRequestStatus.find(
      c => c.id === entity.getDataValue('status')
    )
  };
};

module.exports = {
  list,
  getOrgById,
  pagedSearch,
  add,
  update,
  listOfCategory,
  addAssociation,
  removeAssociationsOfType,
  getOrgByUrn,
  getOrgByUid,
  getOrgByEstablishmentNumber,
  getOrgByUkprn,
  getAllOrgsByUkprn,
  getOrgByLegacyId,
  getOrganisationsForUserIncludingServices,
  getOrganisationsAssociatedToUser,
  setUserAccessToOrganisation,
  deleteUserOrganisation,
  getOrganisationCategories,
  getOrganisationStates,
  getUsersPendingApprovalByUser,
  getUsersPendingApproval,
  pagedListOfCategory,
  getUsersAssociatedWithOrganisation,
  pagedListOfUsers,
  pagedListOfInvitations,
  getUserOrganisationByTextIdentifier,
  getNextUserOrgNumericIdentifier,
  getNextOrganisationLegacyId,
  listAnnouncements,
  upsertAnnouncement,
  createUserOrgRequest,
  getUserOrgRequestById,
  getApproversForOrg,
  getAllPendingRequestsForApprover,
  getRequestsAssociatedWithOrganisation,
  updateUserOrgRequest,
  getRequestsAssociatedWithUser,
  getPagedListOfUsersV2,
  getPagedListOfUsersV3,
  pagedListOfRequests,
  getLatestActionedRequestAssociated
};
