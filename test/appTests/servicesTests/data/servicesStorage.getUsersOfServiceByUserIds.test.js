jest.mock("./../../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

jest.mock("./../../../../src/infrastructure/repository", () =>
  require("./mockServicesRepository").mockRepository(),
);
jest.mock("uuid");

const uuid = require("uuid");
const repository = require("./../../../../src/infrastructure/repository");
const {
  getUsersOfServiceByUserIds,
} = require("./../../../../src/app/services/data/servicesStorage");

const userIds = "user-1";
const sid = "service-1";
const correlationId = "correlation-id";
const from = new Date("2024-12-01");
const to = new Date("2024-12-30");

const mockRow = {
  user_id: "user1",
  organisation_id: "org1",
  user_status: 1,
  user_createdAt: "2025-01-30T14:35:45Z",
  user_updatedAt: "2025-01-30T14:35:45Z",
  id: "org1",
  name: "Test Org",
};

const mockUserService = {
  getRole: jest.fn().mockResolvedValue({ id: 12, name: "user" }),
};

describe("When using the getUsersOfServiceByUserIds function", () => {
  beforeEach(() => {
    repository.mockResetAll();
    repository.sequelize.query.mockClear();
    uuid.v4.mockReset().mockReturnValue("new-uuid");
  });

  it("finds the user record and maps it", async () => {
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    const actual = await getUsersOfServiceByUserIds(
      sid,
      userIds,
      undefined,
      undefined,
      undefined,
      1,
      25,
      correlationId,
    );

    expect(actual.page).toBe(1);
    expect(actual.totalNumberOfPages).toBe(1);
    expect(actual.totalNumberOfRecords).toBe(1);
    expect(actual.users).toHaveLength(1);
    expect(actual.users[0].id).toBe("user1");
    expect(actual.users[0].status).toBe(1);
    expect(repository.sequelize.query).toHaveBeenCalledTimes(2);
    const firstCall = repository.sequelize.query.mock.calls[0];
    expect(firstCall[0]).toContain("SELECT");
    expect(firstCall[1].replacements.serviceId).toBe(sid);
    expect(firstCall[1].replacements.limit).toBe(25);
    expect(firstCall[1].replacements.offset).toBe(0);
  });

  it("adds the status in the where clause when it's provided", async () => {
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    const actual = await getUsersOfServiceByUserIds(
      sid,
      userIds,
      1,
      undefined,
      undefined,
      1,
      25,
      correlationId,
    );

    expect(actual.users).toHaveLength(1);
    expect(repository.sequelize.query).toHaveBeenCalledTimes(2);
    const firstCall = repository.sequelize.query.mock.calls[0];
    expect(firstCall[0]).toContain("AND u.status = :status");
    expect(firstCall[1].replacements.status).toBe(1);
  });

  it("adds the from and to date as BETWEEN in the where clause when both are provided", async () => {
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    const actual = await getUsersOfServiceByUserIds(
      sid,
      userIds,
      1,
      from,
      to,
      1,
      25,
      correlationId,
    );

    expect(actual.users).toHaveLength(1);
    expect(repository.sequelize.query).toHaveBeenCalledTimes(2);
    const firstCall = repository.sequelize.query.mock.calls[0];
    expect(firstCall[0]).toContain("AND u.updatedAt BETWEEN :from AND :to");
    expect(firstCall[1].replacements.from).toEqual(from);
    expect(firstCall[1].replacements.to).toEqual(to);
  });

  it("adds the from >= comparison in the where clause when only from is provided", async () => {
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    const actual = await getUsersOfServiceByUserIds(
      sid,
      userIds,
      1,
      from,
      undefined,
      1,
      25,
      correlationId,
    );

    expect(actual.users).toHaveLength(1);
    expect(repository.sequelize.query).toHaveBeenCalledTimes(2);
    const firstCall = repository.sequelize.query.mock.calls[0];
    expect(firstCall[0]).toContain("AND u.updatedAt >= :from");
    expect(firstCall[1].replacements.from).toEqual(from);
  });

  it("adds the to <= comparison in the where clause when only to is provided", async () => {
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    const actual = await getUsersOfServiceByUserIds(
      sid,
      userIds,
      1,
      undefined,
      to,
      1,
      25,
      correlationId,
    );

    expect(actual.users).toHaveLength(1);
    expect(repository.sequelize.query).toHaveBeenCalledTimes(2);
    const firstCall = repository.sequelize.query.mock.calls[0];
    expect(firstCall[0]).toContain("AND u.updatedAt <= :to");
    expect(firstCall[1].replacements.to).toEqual(to);
  });
});
