const { pagedListOfUsers } = require("./data/organisationsStorage");

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
const getPageSize = (req) => {
  if (!req.query.pageSize) {
    return 100;
  }

  const pageSize = parseInt(req.query.pageSize);
  if (isNaN(pageSize)) {
    return 100;
  }

  return pageSize;
};

const listUserOrganisations = async (req, res) => {
  const pageNumber = getPageNumber(req);
  const pageSize = getPageSize(req);

  const page = await pagedListOfUsers(pageNumber, pageSize);
  return res.contentType("json").send(page);
};

module.exports = listUserOrganisations;
