const { getPagedListOfUsersV3 } = require("./data/organisationsStorage");

const getPageNumber = (req) => {
  if (!req.body.page) {
    return 1;
  }

  const page = parseInt(req.body.page);
  if (isNaN(page)) {
    return 1;
  }

  return page;
};

const getPageSize = (req) => {
  if (!req.body.pageSize) {
    return 100;
  }

  const pageSize = parseInt(req.body.pageSize);
  if (isNaN(pageSize)) {
    return 100;
  }

  return pageSize;
};

const getRoleId = (req) => {
  if (!req.body.role) {
    return undefined;
  }
  const roleId = parseInt(req.body.role);
  if (isNaN(roleId)) {
    return undefined;
  }
  return roleId;
};

const getPolicies = (req) => {
  if (!req.body.policies) {
    return [];
  }
  return req.body.policies;
};

const listUserOrganisationsV3 = async (req, res) => {
  const pageNumber = getPageNumber(req);
  const pageSize = getPageSize(req);
  const roleId = getRoleId(req);
  const policies = getPolicies(req);

  const page = await getPagedListOfUsersV3(
    pageNumber,
    pageSize,
    roleId,
    policies,
  );
  return res.json(page);
};

module.exports = listUserOrganisationsV3;
