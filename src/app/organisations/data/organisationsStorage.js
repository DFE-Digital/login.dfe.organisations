const { list } = require('./../../services/data/organisationsStorage');
const { organisations, organisationStatus, organisationCategory } = require('./../../../infrastructure/repository');
const Sequelize = require('sequelize');

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
      type: entity.Type,
      urn: entity.URN,
      uid: entity.UID,
      ukprn: entity.UKPRN,
      establishmentNumber: entity.EstablishmentNumber,
      status: organisationStatus.find(c => c.id === entity.Status),
      closedOn: entity.ClosedOn,
    };
  });
  return {
    organisations: orgs,
    totalNumberOfPages,
  };
};

module.exports = {
  list,
  pagedList,
};
