jest.mock("./../../../src/app/services/data/servicesStorage", () => {
  const getById = jest.fn();
  const getUsersOfServiceByUserIds = jest.fn();
  return {
    getById: jest.fn().mockImplementation(getById),
    getUsersOfServiceByUserIds: jest
      .fn()
      .mockImplementation(getUsersOfServiceByUserIds),
  };
});

jest.mock("./../../../src/infrastructure/repository", () => {
  const SequalizeMock = require("sequelize-mock");
  return new SequalizeMock();
});
jest.mock("./../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
  };
});
const servicesStorage = require("../../../src/app/services/data/servicesStorage");
const getAllServiceUsers = require("../../../src/app/services/getAllServiceUsers");
const httpMocks = require("node-mocks-http");

describe("when getting users of services", () => {
  let req;
  const res = httpMocks.createResponse();
  const expectedRequestCorrelationId = "392f0e46-787b-41bc-9e77-4c3cb94824bb";

  beforeEach(() => {
    req = {
      params: {
        sid: "9d672383-cf21-49b4-86d2-7cea955ad422",
        org_id: "1d672383-cf21-49b4-86d2-7cea955ad422",
      },
      body: {
        userIds: "36177ddb-aec4-4583-a6e3-43bbf78d8b5b",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      method: "POST",
      header(header) {
        return this.headers[header];
      },
    };

    servicesStorage.getById.mockReset();
    servicesStorage.getUsersOfServiceByUserIds.mockReset();

    servicesStorage.getUsersOfServiceByUserIds.mockReturnValue({
      users: [
        {
          id: "user1",
          status: 1,
          role: {
            id: 12,
            name: "user",
          },
          createdAt: "2025-01-30T14:35:45Z",
          updatedAt: "2025-01-30T14:35:45Z",
          organisation: {},
        },
      ],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 1,
    });

    servicesStorage.getById.mockReturnValue({
      id: "service1",
      name: "service one",
      description: "the first service",
    });
  });

  it("then it should send 404 if service id is not a uuid", async () => {
    req.params.sid = "not-a-uuid";

    await getAllServiceUsers(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send 404 if service not found", async () => {
    servicesStorage.getById.mockReset();
    servicesStorage.getUsersOfServiceByUserIds.mockReset();

    servicesStorage.getUsersOfServiceByUserIds.mockReturnValue([]);
    servicesStorage.getById.mockReturnValue(null);

    await getAllServiceUsers(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send 400 if status is not 1 or 0", async () => {
    req.body.status = {
      status: 2,
    };
    await getAllServiceUsers(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send 200 if service found", async () => {
    await getAllServiceUsers(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });
});
