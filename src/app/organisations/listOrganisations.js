const { list } = require('./data/organisationsStorage');
const { chunk } = require('lodash');

const pageSize = 2;

const getPageNumber = (req) => {
  if (!req.query.page) {
    return 1;
  }

  const page = parseInt(req.query.page);
  if (isNaN(page)) {
    return 1;
  }

  return page;
};

const listOrganisations = async (req, res) => {
  const page = getPageNumber(req);
  const all = await list();
  const pages = chunk(all, pageSize);

  return res.contentType('json').send({
    organisations: pages[page - 1],
    page,
    totalNumberOfPages: pages.length,
  });
};

module.exports = listOrganisations;
