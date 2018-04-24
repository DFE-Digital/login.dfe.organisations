const { pagedList, search } = require('./data/organisationsStorage');

const pageSize = 25;

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
  const pageNumber = getPageNumber(req);
  const criteria = req.query.search;

  let page;
  if (criteria && criteria.trim().length > 0) {
    page = await search(criteria, pageNumber, pageSize);
  } else {
    page = await pagedList(pageNumber, pageSize);
  }

  return res.contentType('json').send({
    organisations: page.organisations,
    page: pageNumber,
    totalNumberOfPages: page.totalNumberOfPages,
    totalNumberOfRecords: page.totalNumberOfRecords,
  });
};

module.exports = listOrganisations;
