const uuid = require("uuid");

const mockTable = () => {
  return {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    mockResetAll: function () {
      this.findAll.mockReset().mockReturnValue([]);
      this.findAndCountAll.mockReset().mockReturnValue([]);
      this.findAll.mockReset();
      this.create.mockReset();
      this.upsert.mockReset();
      this.update.mockReset();
      this.destroy.mockReset();
    },
  };
};
const mockRepository = () => {
  return {
    connection: { query: jest.fn() },
    users: mockTable(),
    userServices: mockTable(),
    organisations: mockTable(),

    mockResetAll: function () {
      this.connection.query.mockReset();
      this.users.mockResetAll();
      this.userServices.mockResetAll();
      this.organisations.mockResetAll();
    },
  };
};

const mockUserServiceEntity = (
  data,
  identifiers = undefined,
  roles = undefined,
) => {
  const defaultEntity = {
    service_id: uuid.v4(),
    organisation_id: uuid.v4(),
    createdAt: new Date(),
    getIdentifiers: jest.fn().mockReturnValue(identifiers),
    getRoles: jest.fn().mockReturnValue(roles),
  };
  const entity = Object.assign({}, defaultEntity, data);
  entity.mockResetAll = function () {
    this.getIdentifiers.mockReset().mockReturnValue(identifiers);
    this.getRoles.mockReset().mockReturnValue(roles);
  };
  return entity;
};

module.exports = {
  mockRepository,
  mockUserServiceEntity,
};
