const createJestMockForSequelizeEntity = (tuple) => {
  const fields = Object.keys(tuple);

  return Object.assign({
    getDataValue: jest.fn().mockImplementation((fieldName) => {
      if (!fields.find((x) => x === fieldName)) {
        return undefined;
      }

      return tuple(fieldName);
    }),
  }, tuple);
};

module.exports = {
  createJestMockForSequelizeEntity,
};
