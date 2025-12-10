const logger = require("./../../../infrastructure/logger");
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
  organisationAnnouncements,
  userOrganisationRequests,
  organisationRequestStatus,
  serviceRequestStatus,
  serviceRequestsTypes,
  getNextNumericId,
  getNextLegacyId,
  userServiceRequests,
} = require("./../../../infrastructure/repository");
const Sequelize = require("sequelize");
const { uniq, trim, orderBy } = require("lodash");
const {
  mapArrayToProperty,
  arrayToMapById,
  mapAndFilterArray,
} = require("./../../../utils");
const uuid = require("uuid");

const Op = Sequelize.Op;

const updateIfValid = (oldValue, newValue) => {
  const trimmedNewValue = trim(newValue);
  return trimmedNewValue || oldValue;
};

/* takes an existing organisation, and an organisation object that can contain either a new org name, a new org address or both. The existing 'entity' is updated with the new fields contained in the object */
const updateEntityWithUpdatedFields = (entity, organisation) => {
  if (organisation.name) {
    entity.name = organisation.name;
  }
  if (organisation.address) {
    entity.Address = organisation.address;
  }
};

/* takes an existing entity and an object with every field that makes up an organisation record filled in and then overlays the entire new object over the old one */
const updateEntityFromOrganisation = (entity, organisation) => {
  entity.name = organisation.name;
  entity.LegalName = organisation.LegalName;
  entity.Category = organisation.category.id;
  entity.Type = organisation.type ? organisation.type.id : null;
  entity.URN = updateIfValid(entity.URN, organisation.urn);
  entity.UID = organisation.uid;
  entity.UPIN = organisation.upin;
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
  entity.SourceSystem = organisation.SourceSystem;
  entity.ProviderTypeName = organisation.providerTypeName;
  entity.ProviderTypeCode = organisation.ProviderTypeCode;
  entity.GIASProviderType = organisation.GIASProviderType;
  entity.PIMSProviderType = organisation.PIMSProviderType;
  entity.PIMSProviderTypeCode = organisation.PIMSProviderTypeCode;
  entity.PIMSStatusName = organisation.PIMSStatusName;
  entity.PIMSStatus = organisation.pimsStatus;
  entity.GIASStatusName = organisation.GIASStatusName;
  entity.GIASStatus = organisation.GIASStatus;
  entity.MasterProviderStatusName = organisation.MasterProviderStatusName;
  entity.MasterProviderStatusCode = organisation.MasterProviderStatusCode;
  entity.OpenedOn = organisation.OpenedOn;
  entity.DistrictAdministrativeName = organisation.DistrictAdministrativeName;
  entity.DistrictAdministrativeCode = organisation.DistrictAdministrativeCode;
  entity.DistrictAdministrative_code = organisation.DistrictAdministrative_code;
  entity.IsOnAPAR = organisation.IsOnAPAR;
};
const updateOrganisationsWithLocalAuthorityDetails = async (orgs) => {
  const localAuthorityIds = uniq(
    orgs.filter((o) => o.localAuthority).map((o) => o.localAuthority.id),
  );
  if (localAuthorityIds.length > 0) {
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
      const laOrgs = orgs.filter(
        (o) => o.localAuthority && o.localAuthority.id === localAuthority.id,
      );
      laOrgs.forEach((org) => (org.localAuthority = localAuthority));
    });
  }
};
const mapOrganisationFromEntity = (entity) => {
  if (!entity) {
    return null;
  }

  const laAssociation = entity.associations
    ? entity.associations.find((a) => a.link_type === "LA")
    : undefined;
  const category = organisationCategory.find(
    (c) => c.id === entity.Category,
  ) || { id: entity.Category, name: "Unknown" };
  return {
    id: entity.id,
    name: entity.name,
    LegalName: entity.LegalName,
    category,
    type: establishmentTypes.find((c) => c.id === entity.Type),
    urn: entity.URN,
    uid: entity.UID,
    upin: entity.UPIN,
    ukprn: entity.UKPRN,
    establishmentNumber: entity.EstablishmentNumber,
    status: organisationStatus.find((c) => c.id === entity.Status),
    closedOn: entity.ClosedOn,
    address: entity.Address,
    telephone: entity.telephone,
    region: regionCodes.find((c) => c.id === entity.regionCode),
    localAuthority: laAssociation
      ? {
          id: laAssociation.associated_organisation_id,
        }
      : undefined,
    phaseOfEducation: phasesOfEducation.find(
      (c) => c.id === entity.phaseOfEducation,
    ),
    statutoryLowAge: entity.statutoryLowAge,
    statutoryHighAge: entity.statutoryHighAge,
    legacyId: entity.legacyId,
    companyRegistrationNumber: entity.companyRegistrationNumber,
    SourceSystem: entity.SourceSystem,
    providerTypeName: entity.ProviderTypeName,
    ProviderTypeCode: entity.ProviderTypeCode,
    GIASProviderType: entity.GIASProviderType,
    PIMSProviderType: entity.PIMSProviderType,
    PIMSProviderTypeCode: entity.PIMSProviderTypeCode,
    PIMSStatusName: entity.PIMSStatusName,
    pimsStatus: entity.PIMSStatus,
    GIASStatusName: entity.GIASStatusName,
    GIASStatus: entity.GIASStatus,
    MasterProviderStatusName: entity.MasterProviderStatusName,
    MasterProviderStatusCode: entity.MasterProviderStatusCode,
    OpenedOn: entity.OpenedOn,
    DistrictAdministrativeName: entity.DistrictAdministrativeName,
    DistrictAdministrativeCode: entity.DistrictAdministrativeCode,
    DistrictAdministrative_code: entity.DistrictAdministrative_code,
    IsOnAPAR: entity.IsOnAPAR,
  };
};
const mapOrganisationFromEntityWithNewPPFields = (entity) => {
  if (!entity) {
    return null;
  }

  const laAssociation = entity.associations
    ? entity.associations.find((a) => a.link_type === "LA")
    : undefined;
  const category = organisationCategory.find(
    (c) => c.id === entity.Category,
  ) || { id: entity.Category, name: "Unknown" };
  return {
    id: entity.id,
    name: entity.name,
    LegalName: entity.LegalName,
    category,
    type: establishmentTypes.find((c) => c.id === entity.Type),
    urn: entity.URN,
    uid: entity.UID,
    upin: entity.UPIN,
    ukprn: entity.UKPRN,
    establishmentNumber: entity.EstablishmentNumber,
    status: organisationStatus.find((c) => c.id === entity.Status),
    closedOn: entity.ClosedOn,
    address: entity.Address,
    telephone: entity.telephone,
    region: regionCodes.find((c) => c.id === entity.regionCode),
    localAuthority: laAssociation
      ? {
          id: laAssociation.associated_organisation_id,
        }
      : undefined,
    phaseOfEducation: phasesOfEducation.find(
      (c) => c.id === entity.phaseOfEducation,
    ),
    statutoryLowAge: entity.statutoryLowAge,
    statutoryHighAge: entity.statutoryHighAge,
    legacyId: entity.legacyId,
    companyRegistrationNumber: entity.companyRegistrationNumber,
    SourceSystem: entity.SourceSystem,
    providerTypeName: entity.ProviderTypeName,
    ProviderTypeCode: entity.ProviderTypeCode,
    GIASProviderType: entity.GIASProviderType,
    PIMSProviderType: entity.PIMSProviderType,
    PIMSProviderTypeCode: entity.PIMSProviderTypeCode,
    PIMSStatusName: entity.PIMSStatusName,
    pimsStatus: entity.PIMSStatus,
    GIASStatusName: entity.GIASStatusName,
    GIASStatus: entity.GIASStatus,
    MasterProviderStatusName: entity.MasterProviderStatusName,
    MasterProviderStatusCode: entity.MasterProviderStatusCode,
    OpenedOn: entity.OpenedOn,
    DistrictAdministrativeName: entity.DistrictAdministrativeName,
    DistrictAdministrativeCode: entity.DistrictAdministrativeCode,
    DistrictAdministrative_code: entity.DistrictAdministrative_code,
    IsOnAPAR: entity.IsOnAPAR,
  };
};
const mapAnnouncementFromEntity = (entity) => {
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
    published: entity.published,
  };
};

const list = async (includeAssociations = false) => {
  try {
    const findOrgsOpts = {};
    if (includeAssociations) {
      findOrgsOpts.include = ["associations"];
    }
    const orgEntities = await organisations.findAll(findOrgsOpts);
    if (!orgEntities) {
      return null;
    }

    return await Promise.all(
      orgEntities.map(async (serviceEntity) => {
        const organisation = {
          id: serviceEntity.getDataValue("id"),
          name: serviceEntity.getDataValue("name"),
          LegalName: serviceEntity.getDataValue("LegalName"),
          category: organisationCategory.find(
            (c) => c.id === serviceEntity.Category,
          ),
          type: establishmentTypes.find((c) => c.id === serviceEntity.Type),
          urn: serviceEntity.URN,
          uid: serviceEntity.UID,
          upin: serviceEntity.UPIN,
          ukprn: serviceEntity.UKPRN,
          establishmentNumber: serviceEntity.EstablishmentNumber,
          status: organisationStatus.find((c) => c.id === serviceEntity.Status),
          closedOn: serviceEntity.ClosedOn,
          address: serviceEntity.Address,
          SourceSystem: serviceEntity.SourceSystem,
          providerTypeName: serviceEntity.ProviderTypeName,
          ProviderTypeCode: serviceEntity.ProviderTypeCode,
          GIASProviderType: serviceEntity.GIASProviderType,
          PIMSProviderType: serviceEntity.PIMSProviderType,
          PIMSProviderTypeCode: serviceEntity.PIMSProviderTypeCode,
          PIMSStatusName: serviceEntity.PIMSStatusName,
          pimsStatus: serviceEntity.PIMSStatus,
          GIASStatusName: serviceEntity.GIASStatusName,
          GIASStatus: serviceEntity.GIASStatus,
          MasterProviderStatusName: serviceEntity.MasterProviderStatusName,
          MasterProviderStatusCode: serviceEntity.MasterProviderStatusCode,
          OpenedOn: serviceEntity.OpenedOn,
          DistrictAdministrativeName: serviceEntity.DistrictAdministrativeName,
          DistrictAdministrativeCode: serviceEntity.DistrictAdministrativeCode,
          DistrictAdministrative_code:
            serviceEntity.DistrictAdministrative_code,
          IsOnAPAR: serviceEntity.IsOnAPAR,
        };

        if (serviceEntity.associations) {
          organisation.associations = serviceEntity.associations.map(
            (assEntity) => ({
              associatedOrganisationId: assEntity.associated_organisation_id,
              associationType: assEntity.link_type,
            }),
          );
        }

        return organisation;
      }),
    );
  } catch (e) {
    logger.error(`error getting organisations - ${e.message}`, e);
    throw e;
  }
};

const getOrgById = async (id) => {
  const entity = await organisations.findOne({
    where: {
      id: {
        [Op.eq]: id,
      },
    },
    include: ["associations"],
  });
  const org = mapOrganisationFromEntity(entity);
  if (org) {
    await updateOrganisationsWithLocalAuthorityDetails([org]);
  }
  return org;
};

const pagedSearch = async (
  criteria,
  pageNumber = 1,
  pageSize = 25,
  filterCategories = [],
  filterStates = [],
  filterOutOrgNames = [],
  sortBy,
  sortDirection,
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: { Status: { [Op.not]: 0 } },
    order: [["name", "ASC"]],
    include: ["associations"],
    distinct: true,
    limit: pageSize,
    offset,
  };
  if (sortBy && sortBy !== undefined) {
    query.order[0][0] = `${sortBy}`;
  }

  if (sortDirection && sortDirection !== undefined) {
    query.order[0][1] = `${sortDirection}`;
  }

  if (criteria && criteria !== undefined) {
    query.where = {
      [Op.or]: {
        name: {
          [Op.like]: `%${criteria}%`,
        },
        LegalName: {
          [Op.like]: `%${criteria}%`,
        },
        urn: {
          [Op.like]: `%${criteria}%`,
        },
        uid: {
          [Op.like]: `%${criteria}%`,
        },
        upin: {
          [Op.like]: `%${criteria}%`,
        },
        ukprn: {
          [Op.like]: `%${criteria}%`,
        },
        establishmentNumber: {
          [Op.like]: `%${criteria}%`,
        },
        legacyId: {
          [Op.like]: `%${criteria}%`,
        },
      },
      [Op.and]: { Status: { [Op.not]: 0 } },
    };
  }

  if (filterOutOrgNames.length > 0) {
    query.where.name = {
      [Op.notIn]: filterOutOrgNames,
    };
  }

  if (filterCategories.length > 0) {
    query.where.Category = {
      [Op.in]: filterCategories,
    };
  }

  if (filterStates.length > 0) {
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

const add = async (organisation) => {
  const entity = {
    id: organisation.id,
  };
  updateEntityFromOrganisation(entity, organisation);
  await organisations.create(entity);
};

const update = async (organisation) => {
  const existing = await organisations.findOne({
    where: {
      id: {
        [Op.eq]: organisation.id,
      },
    },
  });

  if (!existing) {
    throw new Error(
      `Cannot find organisation in database with id ${organisation.id}`,
    );
  }

  updateEntityFromOrganisation(existing, organisation);
  await existing.save();
};

const updateOtherStakeholders = async (organisation) => {
  const existing = await organisations.findOne({
    where: {
      id: {
        [Op.eq]: organisation.id,
      },
    },
  });

  if (!existing) {
    throw new Error(
      `Cannot find organisation in database with id ${organisation.id}`,
    );
  }

  updateEntityWithUpdatedFields(existing, organisation);
  await existing.save();
};

const listOfCategory = async (category, includeAssociations = false) => {
  const query = {
    where: {
      Category: {
        [Op.eq]: category,
      },
    },
    order: [["name", "ASC"]],
  };
  if (includeAssociations) {
    query.include = ["associations"];
  }
  const orgEntities = await organisations.findAll(query);
  return orgEntities.map((entity) => ({
    id: entity.id,
    name: entity.name,
    LegalName: entity.LegalName,
    category: organisationCategory.find((c) => c.id === entity.Category),
    type: establishmentTypes.find((c) => c.id === entity.Type),
    urn: entity.URN,
    uid: entity.UID,
    upin: entity.UPIN,
    ukprn: entity.UKPRN,
    establishmentNumber: entity.EstablishmentNumber,
    status: organisationStatus.find((c) => c.id === entity.Status),
    closedOn: entity.ClosedOn,
    address: entity.Address,
    legacyId: entity.legacyId,
    companyRegistrationNumber: entity.companyRegistrationNumber,
    SourceSystem: entity.SourceSystem,
    providerTypeName: entity.ProviderTypeName,
    ProviderTypeCode: entity.ProviderTypeCode,
    GIASProviderType: entity.GIASProviderType,
    PIMSProviderType: entity.PIMSProviderType,
    PIMSProviderTypeCode: entity.PIMSProviderTypeCode,
    PIMSStatusName: entity.PIMSStatusName,
    pimsStatus: entity.PIMSStatus,
    GIASStatusName: entity.GIASStatusName,
    GIASStatus: entity.GIASStatus,
    MasterProviderStatusName: entity.MasterProviderStatusName,
    MasterProviderStatusCode: entity.MasterProviderStatusCode,
    OpenedOn: entity.OpenedOn,
    DistrictAdministrativeName: entity.DistrictAdministrativeName,
    DistrictAdministrativeCode: entity.DistrictAdministrativeCode,
    DistrictAdministrative_code: entity.DistrictAdministrative_code,
    IsOnAPAR: entity.IsOnAPAR,
  }));
};

const pagedListOfCategory = async (
  category,
  includeAssociations = false,
  pageNumber = 1,
  pageSize = 25,
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {
      Category: {
        [Op.eq]: category,
      },
    },
    order: [
      ["name", "ASC"],
      ["id", "ASC"],
    ],
    limit: pageSize,
    offset,
    distinct: true,
  };
  if (includeAssociations) {
    query.include = ["associations"];
  }

  const result = await organisations.findAndCountAll(query);
  const orgs = result.rows.map((entity) => {
    const organisation = {
      id: entity.id,
      name: entity.name,
      LegalName: entity.LegalName,
      category: organisationCategory.find((c) => c.id === entity.Category),
      type: establishmentTypes.find((c) => c.id === entity.Type),
      urn: entity.URN,
      uid: entity.UID,
      upin: entity.UPIN,
      ukprn: entity.UKPRN,
      establishmentNumber: entity.EstablishmentNumber,
      status: organisationStatus.find((c) => c.id === entity.Status),
      closedOn: entity.ClosedOn,
      address: entity.Address,
      telephone: entity.telephone,
      region: regionCodes.find((c) => c.id === entity.regionCode),
      phaseOfEducation: phasesOfEducation.find(
        (c) => c.id === entity.phaseOfEducation,
      ),
      statutoryLowAge: entity.statutoryLowAge,
      statutoryHighAge: entity.statutoryHighAge,
      legacyId: entity.legacyId,
      companyRegistrationNumber: entity.companyRegistrationNumber,
      SourceSystem: entity.SourceSystem,
      providerTypeName: entity.ProviderTypeName,
      ProviderTypeCode: entity.ProviderTypeCode,
      GIASProviderType: entity.GIASProviderType,
      PIMSProviderType: entity.PIMSProviderType,
      PIMSProviderTypeCode: entity.PIMSProviderTypeCode,
      PIMSStatusName: entity.PIMSStatusName,
      pimsStatus: entity.PIMSStatus,
      GIASStatusName: entity.GIASStatusName,
      GIASStatus: entity.GIASStatus,
      MasterProviderStatusName: entity.MasterProviderStatusName,
      MasterProviderStatusCode: entity.MasterProviderStatusCode,
      OpenedOn: entity.OpenedOn,
      DistrictAdministrativeName: entity.DistrictAdministrativeName,
      DistrictAdministrativeCode: entity.DistrictAdministrativeCode,
      DistrictAdministrative_code: entity.DistrictAdministrative_code,
      IsOnAPAR: entity.IsOnAPAR,
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

const addAssociation = async (
  organisationId,
  associatedOrganisationId,
  linkType,
) => {
  const entity = {
    organisation_id: organisationId,
    associated_organisation_id: associatedOrganisationId,
    link_type: linkType,
  };
  await organisationAssociations.create(entity);
};

const removeAssociations = async (organisationId) => {
  let query = {
    where: {
      organisation_id: {
        [Op.eq]: organisationId,
      },
    },
  };
  await organisationAssociations.destroy(query);
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

// Deprecated
const getOrganisationsForUserIncludingServices = async (userId) => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
    },
    include: ["Organisation"],
    order: [["Organisation", "name", "ASC"]],
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  return await Promise.all(
    userOrgs.map(async (userOrg) => {
      const services = await users.findAll({
        where: {
          user_id: {
            [Op.eq]: userId,
          },
          organisation_id: {
            [Op.eq]: userOrg.organisation_id,
          },
        },
        include: ["Service"],
      });
      const role = await userOrg.getRole();
      const approvers = (await userOrg.getApprovers()).map(
        (user) => user.user_id,
      );

      return {
        organisation: {
          id: userOrg.Organisation.getDataValue("id"),
          name: userOrg.Organisation.getDataValue("name"),
          LegalName:
            userOrg.Organisation.getDataValue("LegalName") || undefined,
          urn: userOrg.Organisation.getDataValue("URN") || undefined,
          uid: userOrg.Organisation.getDataValue("UID") || undefined,
          ukprn: userOrg.Organisation.getDataValue("UKPRN") || undefined,
          address: userOrg.Organisation.getDataValue("Address") || undefined,
          status:
            organisationStatus.find(
              (c) => c.id === userOrg.Organisation.getDataValue("Status"),
            ) || undefined,
          numeric_identifier:
            userOrg.getDataValue("numeric_identifier") || undefined,
          text_identifier: userOrg.getDataValue("text_identifier") || undefined,
          category: organisationCategory.find(
            (c) => c.id === userOrg.Organisation.getDataValue("Category"),
          ),
          type: establishmentTypes.find(
            (t) => t.id === userOrg.Organisation.getDataValue("Type"),
          ),
          companyRegistrationNumber:
            userOrg.Organisation.companyRegistrationNumber,
          SourceSystem:
            userOrg.Organisation.getDataValue("SourceSystem") || undefined,
          providerTypeName:
            userOrg.Organisation.getDataValue("ProviderTypeName") || undefined,
          ProviderTypeCode:
            userOrg.Organisation.getDataValue("ProviderTypeCode") || undefined,
          GIASProviderType:
            userOrg.Organisation.getDataValue("GIASProviderType") || undefined,
          PIMSProviderType:
            userOrg.Organisation.getDataValue("PIMSProviderType") || undefined,
          PIMSProviderTypeCode:
            userOrg.Organisation.getDataValue("PIMSProviderTypeCode") ||
            undefined,
          PIMSStatusName:
            userOrg.Organisation.getDataValue("PIMSStatusName") || undefined,
          pimsStatus:
            userOrg.Organisation.getDataValue("PIMSStatus") || undefined,
          GIASStatusName:
            userOrg.Organisation.getDataValue("GIASStatusName") || undefined,
          GIASStatus:
            userOrg.Organisation.getDataValue("GIASStatus") || undefined,
          MasterProviderStatusName:
            userOrg.Organisation.getDataValue("MasterProviderStatusName") ||
            undefined,
          MasterProviderStatusCode:
            userOrg.Organisation.getDataValue("MasterProviderStatusCode") ||
            undefined,
          OpenedOn: userOrg.Organisation.getDataValue("OpenedOn") || undefined,
          DistrictAdministrativeName:
            userOrg.Organisation.getDataValue("DistrictAdministrativeName") ||
            undefined,
          DistrictAdministrativeCode:
            userOrg.Organisation.getDataValue("DistrictAdministrativeCode") ||
            undefined,
          DistrictAdministrative_code:
            userOrg.Organisation.getDataValue("DistrictAdministrative_code") ||
            undefined,
          IsOnAPAR: userOrg.Organisation.getDataValue("IsOnAPAR") || undefined,
        },
        role,
        approvers,
        services: await Promise.all(
          services.map(async (service) => {
            const externalIdentifiers = (
              await service.getExternalIdentifiers()
            ).map((extId) => ({
              key: extId.identifier_key,
              value: extId.identifier_value,
            }));

            return {
              id: service.Service.getDataValue("id"),
              name: service.Service.getDataValue("name"),
              description: service.Service.getDataValue("description"),
              externalIdentifiers,
              requestDate: service.getDataValue("createdAt"),
              status: service.getDataValue("status"),
            };
          }),
        ),
        numericIdentifier: userOrg.numeric_identifier || undefined,
        textIdentifier: userOrg.text_identifier || undefined,
      };
    }),
  );
};

const getOrganisationsAssociatedToUser = async (
  userId,
  WithNewPPFields = false,
) => {
  const userOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
    },
    include: [
      {
        model: organisations,
        as: "Organisation",
        include: "associations",
      },
    ],
    order: [["Organisation", "name", "ASC"]],
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }

  const mappedUserOrgs = await Promise.all(
    userOrgs.map(async (userOrg) => {
      const role = await userOrg.getRole();
      const approvers = (await userOrg.getApprovers()).map(
        (user) => user.user_id,
      );
      const endUsers = (await userOrg.getEndUsers()).map(
        (user) => user.user_id,
      );
      let organisation;
      if (WithNewPPFields) {
        organisation = mapOrganisationFromEntityWithNewPPFields(
          userOrg.Organisation,
        );
      } else {
        organisation = mapOrganisationFromEntity(userOrg.Organisation);
      }

      return {
        organisation,
        role,
        approvers,
        endUsers,
        numericIdentifier: userOrg.numeric_identifier || undefined,
        textIdentifier: userOrg.text_identifier || undefined,
      };
    }),
  );

  await updateOrganisationsWithLocalAuthorityDetails(
    mappedUserOrgs.map((info) => info.organisation),
  );

  return mappedUserOrgs;
};

const setUserAccessToOrganisation = async (
  organisationId,
  userId,
  roleId,
  status,
  reason,
  numericIdentifier,
  textIdentifier,
) =>
  userOrganisations.upsert({
    user_id: userId.toUpperCase(),
    organisation_id: organisationId,
    role_id: roleId,
    status,
    reason,
    numeric_identifier: numericIdentifier,
    text_identifier: textIdentifier,
  });

const deleteUserOrganisation = async (
  organisationId,
  userId,
  correlationId,
) => {
  try {
    logger.info(
      `Deleting org ${organisationId} for user ${userId} for ${correlationId}`,
      { correlationId },
    );
    await userOrganisations.destroy({
      where: {
        user_id: {
          [Op.eq]: userId,
        },
        organisation_id: {
          [Op.eq]: organisationId,
        },
      },
    });
  } catch (e) {
    logger.error(
      `error deleting organisation for user- ${e.message} (id: ${correlationId})`,
      { correlationId },
    );
    throw e;
  }
};

const deleteOrganisation = async (organisationId) => {
  try {
    logger.info(`Deleting org ${organisationId}`);
    await organisations.destroy({
      where: {
        id: {
          [Op.eq]: organisationId,
        },
      },
    });
  } catch (e) {
    logger.error(
      `error deleting organisation - ${e.message} (id: ${organisationId})`,
    );
    throw e;
  }
};

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
        [Op.in]: userOrgs.map((c) => c.organisation_id),
      },
      status: {
        [Op.eq]: 0,
      },
      user_id: {
        [Op.ne]: userId,
      },
    },
    include: ["Organisation"],
  });

  if (!associatedUsersForApproval || associatedUsersForApproval.length === 0) {
    return [];
  }

  return associatedUsersForApproval.map((entity) => ({
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationUserStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
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
    include: ["Organisation"],
  });

  if (!associatedUsersForApproval || associatedUsersForApproval.length === 0) {
    return [];
  }
  const totalNumberOfRecords = associatedUsersForApproval.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  const usersForApproval = associatedUsersForApproval.rows.map((entity) => ({
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    LegalName: entity.Organisation.getDataValue("LegalName"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    org_address: entity.Organisation.getDataValue("Address"),
    category: organisationCategory.find(
      (c) => c.id === entity.Organisation.getDataValue("Category"),
    ),
    urn: entity.Organisation.getDataValue("URN"),
    uid: entity.Organisation.getDataValue("UID"),
    upin: entity.Organisation.getDataValue("UPIN"),
    ukprn: entity.Organisation.getDataValue("UKPRN"),
    status: organisationUserStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));

  return {
    usersForApproval,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const getOrgByUrn = async (urn, category) => {
  try {
    const query = {
      where: {
        URN: {
          [Op.eq]: urn,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by urn - ${e.message}`, e);
    throw e;
  }
};

const getOrgByUid = async (uid, category) => {
  try {
    const query = {
      where: {
        UID: {
          [Op.eq]: uid,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by uid - ${e.message}`, e);
    throw e;
  }
};

const getOrgByEstablishmentNumber = async (establishmentNumber, category) => {
  try {
    const query = {
      where: {
        EstablishmentNumber: {
          [Op.eq]: establishmentNumber,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(
      `error getting organisation by establishment number - ${e.message}`,
      e,
    );
    throw e;
  }
};

const getOrgByUpin = async (upin, category) => {
  try {
    const query = {
      where: {
        UPIN: {
          [Op.eq]: upin,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by UPIN - ${e.message}`, e);
    throw e;
  }
};

const getAllOrgsByUpin = async (upin, category) => {
  try {
    const query = {
      where: {
        UPIN: {
          [Op.eq]: upin,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const orgEntities = await organisations.findAll(query);
    return orgEntities.map(mapOrganisationFromEntity);
  } catch (e) {
    logger.error(`error getting organisation by UPIN - ${e.message}`, e);
    throw e;
  }
};

const getOrgByUkprn = async (ukprn, category) => {
  try {
    const query = {
      where: {
        UKPRN: {
          [Op.eq]: ukprn,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by UKPRN - ${e.message}`, e);
    throw e;
  }
};

const getAllOrgsByUkprn = async (ukprn, category) => {
  try {
    const query = {
      where: {
        UKPRN: {
          [Op.eq]: ukprn,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const orgEntities = await organisations.findAll(query);
    return orgEntities.map(mapOrganisationFromEntity);
  } catch (e) {
    logger.error(`error getting organisations by UKPRN - ${e.message}`, e);
    throw e;
  }
};

const getAllOrgsByIsOnAPAR = async (IsOnAPAR, category) => {
  try {
    const query = {
      where: {
        IsOnAPAR: {
          [Op.eq]: IsOnAPAR,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const orgEntities = await organisations.findAll(query);
    return orgEntities.map(mapOrganisationFromEntity);
  } catch (e) {
    logger.error(`error getting organisations by IsOnAPAR - ${e.message}`, e);
    throw e;
  }
};

const getOrgByLegacyId = async (legacyId, category) => {
  try {
    const query = {
      where: {
        legacyId: {
          [Op.eq]: legacyId,
        },
      },
    };
    if (category) {
      query.where.Category = {
        [Op.eq]: category,
      };
    }
    const entity = await organisations.findOne(query);
    return mapOrganisationFromEntity(entity);
  } catch (e) {
    logger.error(`error getting organisation by legacy id - ${e.message}`, e);
    throw e;
  }
};

const getUsersAssociatedWithOrganisation = async (
  orgId,
  pageNumber = 1,
  pageSize = 25,
) => {
  const offset = (pageNumber - 1) * pageSize;
  const userOrgs = await userOrganisations.findAndCountAll({
    where: {
      organisation_id: {
        [Op.eq]: orgId,
      },
    },
    limit: pageSize,
    offset,
  });
  if (!userOrgs || userOrgs.length === 0) {
    return [];
  }
  const totalNumberOfRecords = userOrgs.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  return await Promise.all(
    userOrgs.rows.map(async (userOrgEntity) => {
      const role = await userOrgEntity.getRole();
      return {
        id: userOrgEntity.getDataValue("user_id"),
        status: userOrgEntity.getDataValue("status"),
        role,
        numericIdentifier: userOrgEntity.numeric_identifier || undefined,
        textIdentifier: userOrgEntity.text_identifier || undefined,
        totalNumberOfPages,
      };
    }),
  );
};

const pagedListOfUsers = async (pageNumber = 1, pageSize = 25) => {
  const recordset = await userOrganisations.findAndCountAll({
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ["Organisation"],
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
      textIdentifier: entity.text_identifier || undefined,
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    userOrganisations: mappings,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const getPagedListOfUsersV2 = async (
  pageNumber = 1,
  pageSize = 25,
  roleId = undefined,
  filterTypes = undefined,
  filterStatus = undefined,
) => {
  const query = {
    where: {},
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ["Organisation"],
  };

  if (roleId !== undefined) {
    query.where.role_id = {
      [Op.eq]: roleId,
    };
  }
  if (filterTypes && filterTypes.length > 0) {
    query.where["$Organisation.type$"] = {
      [Op.in]: filterTypes,
    };
  }

  if (filterStatus && filterStatus.length > 0) {
    query.where["$Organisation.status$"] = {
      [Op.in]: filterStatus,
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
      textIdentifier: entity.text_identifier || undefined,
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    users: mappings,
    page: pageNumber,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const getPagedListOfUsersV3 = async (
  pageNumber = 1,
  pageSize = 25,
  roleId = undefined,
  policies = undefined,
) => {
  const query = {
    where: {},
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ["Organisation"],
  };

  if (roleId !== undefined) {
    query.where.role_id = {
      [Op.eq]: roleId,
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
          case "organisation.type.id":
            fieldForQuery = "$Organisation.type$";
            break;
          case "organisation.status.id":
            fieldForQuery = "$Organisation.status$";
            break;
          case "organisation.category.id":
            fieldForQuery = "$Organisation.category$";
            break;
          case "organisation.phaseOfEducation.id":
            fieldForQuery = "$Organisation.phaseOfEducation$";
            break;
          case "organisation.ukprn":
            fieldForQuery = "$Organisation.ukprn$";
            break;
          case "id":
            fieldForQuery = "$user_id$";
            break;
          case "organisation.IsOnAPAR":
            fieldForQuery = "$Organisation.IsOnAPAR$";
            break;
          default:
            break;
        }

        // get the operator based on the condition
        switch (condition.operator) {
          case "is":
            operator = Op.in;
            break;
          case "is not":
            operator = Op.notIn;
            break;
          default:
            break;
        }

        // build the query for this condition
        if (fieldForQuery && operator) {
          singlePolicyQueries.push({
            [fieldForQuery]: { [operator]: condition.value },
          });
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
      textIdentifier: entity.text_identifier || undefined,
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    users: mappings,
    page: pageNumber,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const pagedListOfInvitations = async (pageNumber = 1, pageSize = 25) => {
  const recordset = await invitationOrganisations.findAndCountAll({
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: ["Organisation"],
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
      role,
    });
  }

  const totalNumberOfRecords = recordset.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    invitationOrganisations: mappings,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const getUserOrganisationByTextIdentifier = async (textIdentifier) => {
  const entity = await userOrganisations.findOne({
    where: {
      text_identifier: {
        [Op.eq]: textIdentifier,
      },
    },
  });
  return entity || undefined;
};

const hasUserOrganisationsByOrgId = async (orgId) => {
  const entity = await userOrganisations.findOne({
    where: {
      organisation_id: {
        [Op.eq]: orgId,
      },
    },
  });
  return !!entity || undefined;
};

const hasUserOrganisationRequestsByOrgId = async (orgId) => {
  const entity = await userOrganisationRequests.findOne({
    where: {
      organisation_id: {
        [Op.eq]: orgId,
      },
    },
  });
  return !!entity || undefined;
};

const getNextUserOrgNumericIdentifier = async () => {
  const NUMERIC_ID = await getNextNumericId();
  return NUMERIC_ID;
};

const getNextOrganisationLegacyId = async () => {
  const LEGACY_ID = await getNextLegacyId();
  return LEGACY_ID;
};

const listAnnouncements = async (
  organisationId = undefined,
  originId = undefined,
  onlyPublishedAnnouncements = true,
  pageNumber = 1,
  pageSize = 25,
) => {
  const where = {};
  if (onlyPublishedAnnouncements) {
    where.published = {
      [Op.eq]: true,
    };
  }
  if (organisationId) {
    where.organisation_id = {
      [Op.eq]: organisationId,
    };
  }
  if (originId) {
    where.origin_id = {
      [Op.eq]: originId,
    };
  }
  const recordset = await organisationAnnouncements.findAndCountAll({
    where,
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
  });

  const totalNumberOfRecords = recordset.count;
  const numberOfPages = Math.ceil(totalNumberOfRecords / pageSize);
  return {
    announcements: recordset.rows.map(mapAnnouncementFromEntity),
    page: pageNumber,
    numberOfPages,
    totalNumberOfRecords,
  };
};

const upsertAnnouncement = async (
  originId,
  organisationId,
  type,
  title,
  summary,
  body,
  publishedAt,
  expiresAt,
  published,
) => {
  let entity = await organisationAnnouncements.findOne({
    where: {
      origin_id: {
        [Op.eq]: originId,
      },
    },
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
    announcement_id: uuid.v4(),
    origin_id: originId,
    organisation_id: organisationId,
    type,
    title,
    summary,
    body,
    publishedAt,
    expiresAt,
    published,
  };
  await organisationAnnouncements.create(entity);
  return mapAnnouncementFromEntity(entity);
};

const getApproversForOrg = async (organisationId) => {
  const entites = await userOrganisations.findAll({
    where: {
      organisation_id: {
        [Op.eq]: organisationId,
      },
      role_id: {
        [Op.eq]: 10000,
      },
    },
  });
  return await Promise.all(
    entites.map(async (approver) => approver.getDataValue("user_id")),
  );
};

const createUserOrgRequest = async (request) => {
  const id = uuid.v4();
  const entity = {
    id,
    user_id: request.userId.toUpperCase(),
    organisation_id: request.organisationId,
    reason: request.reason,
    status: request.status || 0,
  };
  await userOrganisationRequests.create(entity);
  return id;
};

const getUserOrgRequestById = async (rid) => {
  const entity = await userOrganisationRequests.findOne({
    where: {
      id: {
        [Op.eq]: rid,
      },
    },
    include: ["Organisation"],
  });
  return {
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    actioned_date: entity.getDataValue("actioned_at"),
    actioned_by: entity.getDataValue("actioned_by"),
    actioned_reason: entity.getDataValue("actioned_reason"),
    reason: entity.getDataValue("reason"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  };
};

const getAllPendingRequestsForApprover = async (userId) => {
  const userApproverOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
      role_id: {
        [Op.eq]: 10000,
      },
    },
  });
  if (!userApproverOrgs || userApproverOrgs.length === 0) {
    return [];
  }

  const requestsForUsersOrgs = await userOrganisationRequests.findAll({
    where: {
      organisation_id: {
        [Op.in]: userApproverOrgs.map((c) => c.organisation_id),
      },
      status: {
        [Op.or]: [0, 2, 3],
      },
    },
    include: ["Organisation"],
  });

  if (!requestsForUsersOrgs || requestsForUsersOrgs.length === 0) {
    return [];
  }
  return requestsForUsersOrgs.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));
};
const getAllPendingRequestTypesForApprover = async (
  userId,
  pageNumber = 1,
  pageSize = 25,
  filterDateStart = undefined,
  filterDateEnd = undefined,
) => {
  const userApproverOrgs = await userOrganisations.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
      role_id: {
        [Op.eq]: 10000,
      },
    },
  });

  if (!userApproverOrgs || userApproverOrgs.length === 0) {
    return [];
  }

  const orgIds = userApproverOrgs.map((c) => c.organisation_id);
  const pagedResults = await pagedListOfAllRequestTypesForOrg(
    JSON.stringify(orgIds),
    pageNumber,
    pageSize,
    filterDateStart,
    filterDateEnd,
  );
  if (!pagedResults || pagedResults.length === 0) {
    return [];
  }
  return pagedResults;
};

const getRequestsAssociatedWithOrganisation = async (orgId) => {
  const userOrgRequests = await userOrganisationRequests.findAll({
    where: {
      organisation_id: {
        [Op.eq]: orgId,
      },
      status: {
        [Op.or]: [0, 2, 3],
      },
    },
    include: ["Organisation"],
  });
  if (!userOrgRequests || userOrgRequests.length === 0) {
    return [];
  }

  return userOrgRequests.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));
};

const getRequestsAssociatedWithOrganisations = async (orgIds) => {
  const ids = JSON.parse(decodeURIComponent(orgIds));
  const userOrgRequests = await userOrganisationRequests.findAll({
    where: {
      organisation_id: {
        [Op.in]: ids,
      },
      status: {
        [Op.or]: [0, 2, 3],
      },
    },
    include: ["Organisation"],
  });
  if (!userOrgRequests || userOrgRequests.length === 0) {
    return [];
  }

  return userOrgRequests.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));
};

const pagedListOfRequests = async (
  pageNumber = 1,
  pageSize = 25,
  filterStates = undefined,
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {},
    limit: pageSize,
    offset,
    order: [["createdAt", "ASC"]],
    include: ["Organisation"],
  };

  if (filterStates && filterStates.length > 0) {
    query.where.status = {
      [Op.in]: filterStates,
    };
  }
  const userOrgRequests = await userOrganisationRequests.findAndCountAll(query);
  if (!userOrgRequests || userOrgRequests.length === 0) {
    return [];
  }
  const totalNumberOfRecords = userOrgRequests.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  const requests = userOrgRequests.rows.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
    reason: entity.getDataValue("reason"),
  }));

  return {
    requests,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const updateUserOrgRequest = async (requestId, request) => {
  const existingRequest = await userOrganisationRequests.findOne({
    where: {
      id: {
        [Op.eq]: requestId,
      },
    },
  });

  if (!existingRequest) {
    return null;
  }

  const updatedRequest = Object.assign(existingRequest, request);

  await existingRequest.update({
    status: updatedRequest.status,
    actioned_by: updatedRequest.actioned_by,
    actioned_reason: updatedRequest.actioned_reason,
    actioned_at: updatedRequest.actioned_at,
  });
};

const getRequestsAssociatedWithUser = async (userId) => {
  const userRequests = await userOrganisationRequests.findAll({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
      status: {
        [Op.or]: [0, 2, 3],
      },
    },
    include: ["Organisation"],
  });
  if (!userRequests || userRequests.length === 0) {
    return [];
  }
  return userRequests.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    LegalName: entity.Organisation.getDataValue("LegalName"),
    urn: entity.Organisation.getDataValue("URN"),
    uid: entity.Organisation.getDataValue("UID"),
    upin: entity.Organisation.getDataValue("UPIN"),
    ukprn: entity.Organisation.getDataValue("UKPRN"),
    org_status:
      organisationStatus.find(
        (c) => c.id === entity.Organisation.getDataValue("Status"),
      ) || undefined,
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));
};

const getLatestActionedRequestAssociated = async (userId) => {
  const entity = await userOrganisationRequests.findOne({
    where: {
      user_id: {
        [Op.eq]: userId,
      },
      status: {
        [Op.or]: [-1, 0, 2, 3, 1],
      },
    },
    order: [["actioned_at", "DESC"]],
    include: ["Organisation"],
  });
  if (!entity) {
    return null;
  }
  return {
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    LegalName: entity.Organisation.getDataValue("LegalName"),
    urn: entity.Organisation.getDataValue("URN"),
    uid: entity.Organisation.getDataValue("UID"),
    upin: entity.Organisation.getDataValue("UPIN"),
    ukprn: entity.Organisation.getDataValue("UKPRN"),
    org_status:
      organisationStatus.find(
        (c) => c.id === entity.Organisation.getDataValue("Status"),
      ) || undefined,
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    status: organisationRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  };
};

const getOrganisationsAssociatedToService = async (
  sid,
  criteria,
  page,
  pageSize,
  sortBy,
  sortDirection,
  filterCategories = [],
  filterStates = [],
) => {
  try {
    const orderDirection = sortDirection ? sortDirection.toUpperCase() : "ASC";
    const orderBy = sortBy || "name";

    const fieldsToSearch = [
      "name",
      "LegalName",
      "URN",
      "UID",
      "UPIN",
      "UKPRN",
      "EstablishmentNumber",
      "legacyId",
    ];
    const fieldsToDisplay = [
      ...fieldsToSearch,
      "id",
      "Status",
      "Type",
      "Category",
    ];

    const transformedFieldsToDisplay = fieldsToDisplay.map((field) => [
      Sequelize.col(`Organisation.${field}`),
      field,
    ]);

    const searchQuery = {};

    if (criteria) {
      const likeQueries = fieldsToSearch.map((field) => ({
        [field]: { [Op.like]: `%${criteria}%` },
      }));

      searchQuery[Op.or] = likeQueries;
    }

    if (filterCategories.length > 0) {
      searchQuery.Category = { [Op.in]: filterCategories };
    }

    if (filterStates.length > 0) {
      searchQuery.Status = { [Op.in]: filterStates };
    } else {
      searchQuery.Status = { [Op.not]: 0 };
    }

    const query = {
      where: { service_id: sid },
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("Organisation.id")), "id"],
        ...transformedFieldsToDisplay,
      ],
      include: [
        {
          model: organisations,
          as: "Organisation",
          where: searchQuery,
          attributes: [],
        },
      ],
      order: [["Organisation", orderBy, orderDirection]],
      raw: true,
    };

    const orgCategoriesQuery = {
      where: { service_id: sid },
      attributes: [
        [
          Sequelize.fn("DISTINCT", Sequelize.col("Organisation.Category")),
          "Category",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("Organisation.Category")),
          "CategoryCount",
        ],
      ],
      include: [
        {
          model: organisations,
          as: "Organisation",
          attributes: [],
        },
      ],
      group: ["Organisation.Category"],
      order: [
        [Sequelize.fn("COUNT", Sequelize.col("Organisation.Category")), "DESC"],
      ],
      raw: true,
    };

    const orgStatusesQuery = {
      where: { service_id: sid },
      attributes: [
        [
          Sequelize.fn("DISTINCT", Sequelize.col("Organisation.Status")),
          "Status",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("Organisation.Status")),
          "StatusCount",
        ],
      ],
      include: [
        {
          model: organisations,
          as: "Organisation",
          attributes: [],
        },
      ],
      group: ["Organisation.Status"],
      order: [
        [Sequelize.fn("COUNT", Sequelize.col("Organisation.Status")), "DESC"],
      ],
      raw: true,
    };

    const [organisationEntities, allAvailableCategories, allAvailableStatuses] =
      await Promise.all([
        users.findAll(query),
        users.findAll(orgCategoriesQuery),
        users.findAll(orgStatusesQuery),
      ]);

    const offset = (page - 1) * pageSize;
    const pagedResults = organisationEntities.slice(offset, offset + pageSize);

    const totalNumberOfRecords = organisationEntities.length;
    const organistationsList = pagedResults.map((o) =>
      mapOrganisationFromEntity(o),
    );
    const availableCategories = mapArrayToProperty(
      allAvailableCategories,
      "Category",
    );
    const availableStatuses = mapArrayToProperty(
      allAvailableStatuses,
      "Status",
    );
    const organisationCategoryMap = arrayToMapById(organisationCategory);
    const organisationStatusesMap = arrayToMapById(organisationStatus);

    const organisationCategories = mapAndFilterArray(
      availableCategories,
      organisationCategoryMap,
    );
    const organisationStatuses = mapAndFilterArray(
      availableStatuses,
      organisationStatusesMap,
    );
    return {
      organisations: organistationsList,
      page,
      totalNumberOfPages: Math.ceil(totalNumberOfRecords / pageSize),
      totalNumberOfRecords,
      organisationCategories,
      organisationStatuses,
    };
  } catch (e) {
    logger.error(
      `error getting organisations associated with service ${sid} - ${e.message} - error: ${e}`,
    );
    throw e;
  }
};

const getServiceAndSubServiceReqForOrgs = async (orgIds) => {
  const organisationsIds = JSON.parse(decodeURIComponent(orgIds));
  const userServiceAndSubServiceReq = await userServiceRequests.findAll({
    where: {
      organisation_id: {
        [Op.in]: organisationsIds,
      },
      status: {
        [Op.or]: [0, 2, 3],
      },
    },
    include: ["Organisation"],
  });
  if (
    !userServiceAndSubServiceReq ||
    userServiceAndSubServiceReq.length === 0
  ) {
    return [];
  }

  return userServiceAndSubServiceReq.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    request_type: serviceRequestsTypes.find(
      (e) => e.id === entity.getDataValue("request_type"),
    ),
    status: serviceRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));
};

const pagedListOfAllRequestTypesForOrg = async (
  orgIds,
  pageNumber = 1,
  pageSize = 25,
  filterDateStart = undefined,
  filterDateEnd = undefined,
) => {
  const organisationsIds = JSON.parse(decodeURIComponent(orgIds));

  const query = {
    where: {
      organisation_id: {
        [Op.in]: organisationsIds,
      },
      status: {
        [Op.or]: [0, 2, 3],
      },
    },
    include: ["Organisation"],
  };
  if (filterDateStart !== undefined && filterDateEnd !== undefined) {
    query.where.createdAt = {
      [Op.between]: [filterDateStart, filterDateEnd],
    };
  }

  const userOrgRequests = await userOrganisationRequests.findAndCountAll(query);

  const userServRequests = await userServiceRequests.findAndCountAll(query);
  let orgsAccessRequests = [];
  let orgsServiceSubServiceRequests = [];
  if (userOrgRequests || userOrgRequests.length !== 0) {
    orgsAccessRequests = userOrgRequests.rows.map((entity) => ({
      id: entity.get("id"),
      org_id: entity.Organisation.getDataValue("id"),
      org_name: entity.Organisation.getDataValue("name"),
      user_id: entity.getDataValue("user_id"),
      created_date: entity.getDataValue("createdAt"),
      request_type: { id: "organisation", name: "Organisation access" },
      status: organisationRequestStatus.find(
        (c) => c.id === entity.getDataValue("status"),
      ),
    }));
  }
  if (userServRequests || userOrgRequests.length !== 0) {
    orgsServiceSubServiceRequests = userServRequests.rows.map((entity) => ({
      id: entity.get("id"),
      org_id: entity.Organisation.getDataValue("id"),
      org_name: entity.Organisation.getDataValue("name"),
      service_id: entity.getDataValue("service_id"),
      role_ids: entity.getDataValue("role_ids"),
      user_id: entity.getDataValue("user_id"),
      created_date: entity.getDataValue("createdAt"),
      request_type: serviceRequestsTypes.find(
        (e) => e.id === entity.getDataValue("request_type"),
      ),
      status: serviceRequestStatus.find(
        (c) => c.id === entity.getDataValue("status"),
      ),
    }));
  }

  const allAccessRequestsforOrgs = orgsAccessRequests.concat(
    orgsServiceSubServiceRequests,
  );
  const orderedRequests = orderBy(
    allAccessRequestsforOrgs,
    "created_date",
    "desc",
  );
  const offset = pageSize * (pageNumber - 1);
  const totalNumberOfPages = Math.ceil(orderedRequests.length / pageSize);
  const paginatedItems = orderedRequests.slice(offset, pageSize * pageNumber);
  const totalNumberOfRecords = orderedRequests.length;

  return {
    requests: paginatedItems,
    pageNumber,
    totalNumberOfPages,
    totalNumberOfRecords,
  };
};

const pagedListOfServSubServRequests = async (
  pageNumber = 1,
  pageSize = 25,
  filterStates = undefined,
) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = {
    where: {},
    limit: pageSize,
    offset,
    order: [["createdAt", "ASC"]],
    include: ["Organisation"],
  };

  if (filterStates && filterStates.length > 0) {
    query.where.status = {
      [Op.in]: filterStates,
    };
  }
  const userServSubServRequests =
    await userServiceRequests.findAndCountAll(query);
  if (!userServSubServRequests || userServSubServRequests.length === 0) {
    return [];
  }
  const totalNumberOfRecords = userServSubServRequests.count;
  const totalNumberOfPages = Math.ceil(totalNumberOfRecords / pageSize);

  const requests = userServSubServRequests.rows.map((entity) => ({
    id: entity.get("id"),
    org_id: entity.Organisation.getDataValue("id"),
    org_name: entity.Organisation.getDataValue("name"),
    service_id: entity.getDataValue("service_id"),
    role_ids: entity.getDataValue("role_ids"),
    user_id: entity.getDataValue("user_id"),
    created_date: entity.getDataValue("createdAt"),
    request_type: serviceRequestsTypes.find(
      (e) => e.id === entity.getDataValue("request_type"),
    ),
    status: serviceRequestStatus.find(
      (c) => c.id === entity.getDataValue("status"),
    ),
  }));

  return {
    requests,
    totalNumberOfRecords,
    totalNumberOfPages,
  };
};

const updateUserServSubServRequest = async (requestId, request) => {
  const existingRequest = await userServiceRequests.findOne({
    where: {
      id: {
        [Op.eq]: requestId,
      },
      status: {
        [Op.eq]: 0,
      },
    },
  });

  if (!existingRequest) {
    return null;
  }

  const updatedRequest = Object.assign(existingRequest, request);

  await existingRequest.update({
    status: updatedRequest.status,
    actioned_by: updatedRequest.actioned_by,
    actioned_reason: updatedRequest.actioned_reason,
    actioned_at: updatedRequest.actioned_at,
  });
};

module.exports = {
  list,
  getOrgById,
  pagedSearch,
  add,
  update,
  updateOtherStakeholders,
  listOfCategory,
  addAssociation,
  removeAssociationsOfType,
  removeAssociations,
  getOrgByUrn,
  getOrgByUid,
  getOrgByEstablishmentNumber,
  getOrgByUpin,
  getOrgByUkprn,
  getAllOrgsByUkprn,
  getAllOrgsByIsOnAPAR,
  getOrgByLegacyId,
  getOrganisationsForUserIncludingServices,
  getOrganisationsAssociatedToUser,
  setUserAccessToOrganisation,
  deleteUserOrganisation,
  deleteOrganisation,
  getOrganisationCategories,
  getOrganisationStates,
  getUsersPendingApprovalByUser,
  getUsersPendingApproval,
  pagedListOfCategory,
  getUsersAssociatedWithOrganisation,
  pagedListOfUsers,
  pagedListOfInvitations,
  getUserOrganisationByTextIdentifier,
  hasUserOrganisationsByOrgId,
  getNextUserOrgNumericIdentifier,
  getNextOrganisationLegacyId,
  listAnnouncements,
  upsertAnnouncement,
  createUserOrgRequest,
  getUserOrgRequestById,
  getApproversForOrg,
  getAllPendingRequestsForApprover,
  getRequestsAssociatedWithOrganisation,
  getRequestsAssociatedWithOrganisations,
  updateUserOrgRequest,
  getRequestsAssociatedWithUser,
  getPagedListOfUsersV2,
  getPagedListOfUsersV3,
  pagedListOfRequests,
  getLatestActionedRequestAssociated,
  hasUserOrganisationRequestsByOrgId,
  getOrganisationsAssociatedToService,
  getServiceAndSubServiceReqForOrgs,
  pagedListOfAllRequestTypesForOrg,
  getAllPendingRequestTypesForApprover,
  pagedListOfServSubServRequests,
  updateUserServSubServRequest,
  getAllOrgsByUpin,
};
