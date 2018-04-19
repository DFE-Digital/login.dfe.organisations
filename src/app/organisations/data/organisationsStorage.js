const { list } = require('./../../services/data/organisationsStorage');
const { organisations, organisationStatus, organisationCategory, establishmentTypes } = require('./../../../infrastructure/repository');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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
    name: organisation.name,
    Category: organisation.category.id,
    Type: organisation.type.id,
    URN: organisation.urn,
    UID: organisation.uid,
    UKPRN: organisation.ukprn,
    EstablishmentNumber: organisation.establishmentNumber,
    Status: organisation.status.id,
    ClosedOn: organisation.closedOn,
    Address: organisation.address,
  };
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
  if (existing) {
    await existing.destroy();
  }
  await add(organisation);
};

module.exports = {
  list,
  pagedList,
  add,
  update,
};
