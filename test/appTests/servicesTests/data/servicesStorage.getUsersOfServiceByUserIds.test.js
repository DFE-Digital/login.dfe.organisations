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

// The first query is the service size check; the data and count queries follow it.
const mockServiceRows = (serviceRows) =>
  repository.sequelize.query.mockResolvedValueOnce([{ serviceRows }]);

describe("When using the getUsersOfServiceByUserIds function", () => {
  beforeEach(() => {
    repository.mockResetAll();
    repository.sequelize.query.mockClear();
    uuid.v4.mockReset().mockReturnValue("new-uuid");
  });

  it("finds the user record and maps it", async () => {
    mockServiceRows(1);
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
    expect(repository.sequelize.query).toHaveBeenCalledTimes(3);
    const dataCall = repository.sequelize.query.mock.calls[1];
    expect(dataCall[0]).toContain("SELECT");
    expect(dataCall[1].replacements.serviceId).toBe(sid);
    expect(dataCall[1].replacements.limit).toBe(25);
    expect(dataCall[1].replacements.offset).toBe(0);
  });

  it("adds the status in the where clause when it's provided", async () => {
    mockServiceRows(1);
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
    expect(repository.sequelize.query).toHaveBeenCalledTimes(3);
    const dataCall = repository.sequelize.query.mock.calls[1];
    expect(dataCall[0]).toContain("AND u.status = :status");
    expect(dataCall[1].replacements.status).toBe(1);
  });

  it("adds the from and to date as BETWEEN in the where clause when both are provided", async () => {
    mockServiceRows(1);
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
    expect(repository.sequelize.query).toHaveBeenCalledTimes(3);
    const dataCall = repository.sequelize.query.mock.calls[1];
    expect(dataCall[0]).toContain("AND u.updatedAt BETWEEN :from AND :to");
    expect(dataCall[1].replacements.from).toEqual(from);
    expect(dataCall[1].replacements.to).toEqual(to);
  });

  it("adds the from >= comparison in the where clause when only from is provided", async () => {
    mockServiceRows(1);
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
    expect(repository.sequelize.query).toHaveBeenCalledTimes(3);
    const dataCall = repository.sequelize.query.mock.calls[1];
    expect(dataCall[0]).toContain("AND u.updatedAt >= :from");
    expect(dataCall[1].replacements.from).toEqual(from);
  });

  it("adds the to <= comparison in the where clause when only to is provided", async () => {
    mockServiceRows(1);
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
    expect(repository.sequelize.query).toHaveBeenCalledTimes(3);
    const dataCall = repository.sequelize.query.mock.calls[1];
    expect(dataCall[0]).toContain("AND u.updatedAt <= :to");
    expect(dataCall[1].replacements.to).toEqual(to);
  });

  // Small services are mis-estimated at 1 row and time out without a hash join (NSA-10138).
  it("forces a hash join to the external user table in the data and count queries when unfiltered", async () => {
    mockServiceRows(1);
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    await getUsersOfServiceByUserIds(
      sid,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      25,
      correlationId,
    );

    const [, dataCall, countCall] = repository.sequelize.query.mock.calls;
    expect(dataCall[0]).toContain("OPTION (FORCE ORDER, HASH JOIN);");
    expect(countCall[0]).toContain("OPTION (FORCE ORDER, HASH JOIN);");
  });

  it("forces a hash join to the external user table in the data and count queries when filtered", async () => {
    mockServiceRows(1);
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    await getUsersOfServiceByUserIds(
      sid,
      userIds,
      1,
      from,
      to,
      1,
      25,
      correlationId,
    );

    const [, dataCall, countCall] = repository.sequelize.query.mock.calls;
    expect(dataCall[0]).toContain("OPTION (FORCE ORDER, HASH JOIN);");
    expect(countCall[0]).toContain("OPTION (FORCE ORDER, HASH JOIN);");
  });

  const getFirstPage = () =>
    getUsersOfServiceByUserIds(
      sid,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      25,
      correlationId,
    );

  it("does not force a hash join for a service above the small service limit", async () => {
    mockServiceRows(5001);
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    await getFirstPage();

    const [, dataCall, countCall] = repository.sequelize.query.mock.calls;
    expect(dataCall[0]).toContain("OPTION (FORCE ORDER);");
    expect(dataCall[0]).not.toContain("HASH JOIN");
    expect(countCall[0]).toContain("OPTION (FORCE ORDER);");
    expect(countCall[0]).not.toContain("HASH JOIN");
  });

  it("treats a service at exactly the small service limit as small, with the count returned as a string", async () => {
    mockServiceRows("5000");
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    await getFirstPage();

    const [, dataCall, countCall] = repository.sequelize.query.mock.calls;
    expect(dataCall[0]).toContain("OPTION (FORCE ORDER, HASH JOIN);");
    expect(countCall[0]).toContain("OPTION (FORCE ORDER, HASH JOIN);");
  });

  it("checks the size of the service with a bounded local count before building the paged queries", async () => {
    mockServiceRows(1);
    repository.sequelize.query.mockResolvedValueOnce([mockRow]);
    repository.sequelize.query.mockResolvedValueOnce([{ total: 1 }]);
    repository.users.findOne.mockResolvedValue(mockUserService);

    await getFirstPage();

    const [sizeCall] = repository.sequelize.query.mock.calls;
    expect(sizeCall[0]).toContain("TOP (:cap)");
    expect(sizeCall[0]).not.toContain("dbo.[user]");
    expect(sizeCall[1].replacements).toEqual({ serviceId: sid, cap: 5001 });
  });
});
