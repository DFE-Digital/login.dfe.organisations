const { pagedList } = require('./data/organisationsStorage');

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
  const page = await pagedList(pageNumber, pageSize);
  return res.contentType('json').send({
    organisations: page.organisations,
    page: pageNumber,
    totalNumberOfPages: page.totalNumberOfPages,
  });
};

module.exports = listOrganisations;
