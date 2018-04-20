const { list } = require('./../../services/data/organisationsStorage');
const { organisations, organisationStatus, organisationCategory, establishmentTypes, organisationAssociations } = require('./../../../infrastructure/repository');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const updateEntityFromOrganisation = (entity, organisation) => {
  entity.name = organisation.name;
  entity.Category = organisation.category.id;
  entity.Type = organisation.type.id;
  entity.URN = organisation.urn;
  entity.UID = organisation.uid;
  entity.UKPRN = organisation.ukprn;
  entity.EstablishmentNumber = organisation.establishmentNumber;
  entity.Status = organisation.status.id;
  entity.ClosedOn = organisation.closedOn;
  entity.Address = organisation.address;
};

const pagedList = async (pageNumber = 1, pageSize = 25) => {
  const countResult = await organisations.findAll({
    attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'NumberOfOrganisations']],
  });
  const count = countResult[0].get('NumberOfOrganisations');
  const totalNumberOfPages = Math.ceil(count / pageSize);
  if (totalNumberOfPages < pageNumber) {
    return {
      organisations: [],
      totalNumberOfPages,
    };
  }

  const offset = (pageNumber - 1) * pageSize;
  const orgEntities = await organisations.findAll({
    order: [
      ['name', 'ASC'],
    ],
    limit: pageSize,
    offset,
  });
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
  return {
    organisations: orgs,
    totalNumberOfPages,
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
    throw new Error(`Cannot find organisation in databse with id ${organisation.id}`);
  }

  updateEntityFromOrganisation(existing, organisation);
  await existing.save();
};

const listOfCategory = async (category) => {
  const orgEntities = await organisations.findAll({
    where: {
      Category: {
        [Op.eq]: category,
      },
    },
    order: [
      ['name', 'ASC'],
    ],
  });
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

module.exports = {
  list,
  pagedList,
  add,
  update,
  listOfCategory,
  addAssociation,
  removeAssociationsOfType,
};
