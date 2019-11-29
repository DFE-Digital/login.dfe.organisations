const { pagedSearch } = require('./data/organisationsStorage');

const pageSize = 25;

const fixMultiSelect = (value) => {
  if (!value) {
    return [];
  }
  if (value instanceof Array) {
    return value;
  }
  return [value];
};

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
  const filterCategories = fixMultiSelect(req.query.filtercategory);
  const filterStates = fixMultiSelect(req.query.filterstatus);

  const page = await pagedSearch(criteria, pageNumber, pageSize, filterCategories, filterStates);

  return res.contentType('json').send({
    organisations: page.organisations,
    page: pageNumber,
    totalNumberOfPages: page.totalNumberOfPages,
    totalNumberOfRecords: page.totalNumberOfRecords,
  });
};

module.exports = listOrganisations;
