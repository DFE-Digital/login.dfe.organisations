const createJestMockForSequelizeEntity = (tuple) => {
  const fields = Object.keys(tuple);
  return {
    getDataValue: jest.fn().mockImplementation((fieldName) => {
      if (!fields.find((x) => x === fieldName)) {
        return undefined;
      }

      return tuple(fieldName);
    }),
  };
};

module.exports = {
  createJestMockForSequelizeEntity,
};
