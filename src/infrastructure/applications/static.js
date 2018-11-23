const getPageOfApplications = async (page, pageSize, correlationId) => {
  return {
    services: [],
    numberOfRecords: 0,
    page,
    numberOfPages: 1,
  };
};

module.exports = {
  getPageOfApplications,
};
