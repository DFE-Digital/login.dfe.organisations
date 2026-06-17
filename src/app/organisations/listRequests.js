const { pagedListOfAllRequestTypes } = require("./data/organisationsStorage");

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

const fixMultiSelect = (value) => {
  if (!value) {
    return [];
  }
  if (value instanceof Array) {
    return value;
  }
  return [value];
};

const listRequests = async (req, res) => {
  const pageNumber = getPageNumber(req);
  const filterStates = fixMultiSelect(req.query.filterstatus);
  const filterTypes = fixMultiSelect(req.query.filtertype);
  const filterUserId = req.query.filteruserid || undefined;

  const page = await pagedListOfAllRequestTypes(pageNumber, pageSize, filterStates, filterTypes, filterUserId);

  return res.contentType("json").send({
    requests: page.requests,
    page: pageNumber,
    totalNumberOfPages: page.totalNumberOfPages,
    totalNumberOfRecords: page.totalNumberOfRecords,
  });
};

module.exports = listRequests;
