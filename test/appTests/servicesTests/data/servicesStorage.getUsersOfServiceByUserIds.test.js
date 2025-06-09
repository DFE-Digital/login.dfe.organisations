jest.mock("./../../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
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
const { Op } = require("sequelize");

const userIds = "user-1";
const sid = "service-1";
const correlationId = "correlation-id";
const from = new Date("2024-12-01");
const to = new Date("2024-12-30");

const usersFindAllReturnValue = {
  count: 1,
  rows: {
    map: jest.fn(() => [user]),
  },
};

const user = {
  id: "user1",
  status: 1,
  role: {
    id: 12,
    name: "user",
  },
  createdAt: "2025-01-30T14:35:45Z",
  updatedAt: "2025-01-30T14:35:45Z",
  organisation: {},
};

const expectedResult = {
  page: 1,
  totalNumberOfPages: 1,
  totalNumberOfRecords: 1,
  users: [user],
};

describe("When using the getUsersOfServiceByUserIds function", () => {
  beforeEach(() => {
    repository.mockResetAll();

    uuid.v4.mockReset().mockReturnValue("new-uuid");
  });

  it("finds the user record and maps it", async () => {
    repository.users.findAndCountAll.mockReturnValue(usersFindAllReturnValue);

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

    expect(actual).toEqual(expectedResult);
    expect(repository.users.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(repository.users.findAndCountAll.mock.calls[0][0]).toMatchObject({
      limit: 25,
      offset: 0,
      where: {
        service_id: {
          [Op.eq]: sid,
        },
      },
    });
  });

  it("adds the status in the include section when it's provided", async () => {
    repository.users.findAndCountAll.mockReturnValue(usersFindAllReturnValue);

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

    expect(actual).toEqual(expectedResult);
    expect(repository.users.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(repository.users.findAndCountAll.mock.calls[0][0]).toMatchObject({
      limit: 25,
      offset: 0,
      where: {
        service_id: {
          [Op.eq]: sid,
        },
      },
      include: [
        "Organisation",
        {
          model: undefined,
          as: "User",
          where: {
            status: {
              [Op.eq]: 1,
            },
          },
        },
      ],
    });
  });

  it("adds the from and to date as a op.between in the include section when both are provided", async () => {
    repository.users.findAndCountAll.mockReturnValue(usersFindAllReturnValue);

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

    expect(actual).toEqual(expectedResult);
    expect(repository.users.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(repository.users.findAndCountAll.mock.calls[0][0]).toMatchObject({
      limit: 25,
      offset: 0,
      where: {
        service_id: {
          [Op.eq]: sid,
        },
      },
      include: [
        "Organisation",
        {
          model: undefined,
          as: "User",
          where: {
            updatedAt: {
              [Op.between]: [from, to],
            },
          },
        },
      ],
    });
  });

  it("adds the from op.gte in the include section when only from is provided", async () => {
    repository.users.findAndCountAll.mockReturnValue(usersFindAllReturnValue);

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

    expect(actual).toEqual(expectedResult);
    expect(repository.users.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(repository.users.findAndCountAll.mock.calls[0][0]).toMatchObject({
      limit: 25,
      offset: 0,
      where: {
        service_id: {
          [Op.eq]: sid,
        },
      },
      include: [
        "Organisation",
        {
          model: undefined,
          as: "User",
          where: {
            updatedAt: {
              [Op.gte]: from,
            },
          },
        },
      ],
    });
  });

  it("adds the to op.lte in the include section when only to is provided", async () => {
    repository.users.findAndCountAll.mockReturnValue(usersFindAllReturnValue);

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

    expect(actual).toEqual(expectedResult);
    expect(repository.users.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(repository.users.findAndCountAll.mock.calls[0][0]).toMatchObject({
      limit: 25,
      offset: 0,
      where: {
        service_id: {
          [Op.eq]: sid,
        },
      },
      include: [
        "Organisation",
        {
          model: undefined,
          as: "User",
          where: {
            updatedAt: {
              [Op.lte]: to,
            },
          },
        },
      ],
    });
  });
});
