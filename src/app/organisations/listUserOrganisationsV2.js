const { getPagedListOfUsersV2 } = require('./data/organisationsStorage');

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
const getRoleId = (req) => {
  if (!req.query.role) {
    return undefined;
  }
  const roleId = parseInt(req.query.role);
  if (isNaN(roleId)) {
    return undefined;
  }
  return roleId;
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

const listUserOrganisationsV2 = async (req, res) => {
  const pageNumber = getPageNumber(req);
  const pageSize = getPageSize(req);
  const roleId = getRoleId(req);
  const filterTypes = fixMultiSelect(req.query.filtertype);
  const filterStates = fixMultiSelect(req.query.filterstatus);

  const page = await getPagedListOfUsersV2(pageNumber, pageSize, roleId, filterTypes, filterStates);
  return res.json(page);
};

module.exports = listUserOrganisationsV2;
