const { list } = require('./../../services/data/organisationsStorage');
const { organisations } = require('./../../../infrastructure/repository');
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
  const orgs = await organisations.findAll({
    order: [
      ['name', 'ASC'],
    ],
    limit: pageSize,
    offset,
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
