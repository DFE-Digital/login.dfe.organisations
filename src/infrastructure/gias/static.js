const getEstablishmentsFile = async (includeLinks = false) => {
  return Promise.resolve({
    establishments: null,
    links: includeLinks ? null : undefined,
  });
};

const getGroupsFile = async (includeLinks = false) => {
  return Promise.resolve({
    groups: null,
    links: includeLinks ? null : undefined,
  });
};

module.exports = {
  getEstablishmentsFile,
  getGroupsFile,
};
