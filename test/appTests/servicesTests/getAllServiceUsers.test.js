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

const res = {
  json: jest.fn(),
  status: jest.fn(),
  send: jest.fn(),
  mockResetAll: function () {
    this.json.mockReset().mockReturnValue(this);
    this.status.mockReset().mockReturnValue(this);
    this.send.mockReset().mockReturnValue(this);
  },
};

describe("when getting users of services", () => {
  let req;
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
    res.mockResetAll();

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

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("then it should send 404 if service not found", async () => {
    servicesStorage.getById.mockReset();
    servicesStorage.getUsersOfServiceByUserIds.mockReset();

    servicesStorage.getUsersOfServiceByUserIds.mockReturnValue([]);
    servicesStorage.getById.mockReturnValue(null);

    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("then it should send 400 if status is not 1 or 0", async () => {
    req.body = {
      status: "2",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Status must be 1 or 0");
  });

  it("then it should send 400 if status is not a number", async () => {
    req.body = {
      status: "not-a-number",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Status must be 1 or 0");
  });

  it("then it should send 200 if service found", async () => {
    await getAllServiceUsers(req, res);

    expect(servicesStorage.getUsersOfServiceByUserIds).toHaveBeenCalledWith(
      "9d672383-cf21-49b4-86d2-7cea955ad422",
      "36177ddb-aec4-4583-a6e3-43bbf78d8b5b",
      undefined,
      undefined,
      undefined,
      1,
      25,
      "392f0e46-787b-41bc-9e77-4c3cb94824bb",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 1,
      users: [
        {
          createdAt: "2025-01-30T14:35:45Z",
          id: "user1",
          organisation: {},
          role: {
            id: 12,
            name: "user",
          },
          status: 1,
          updatedAt: "2025-01-30T14:35:45Z",
        },
      ],
    });
  });

  it("then it should send 400 if page is not a number", async () => {
    req.body = {
      status: "1",
      page: "apple",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("page must be greater than 0");
  });

  it("then it should send 400 if pageSize is not a number", async () => {
    req.body = {
      status: "1",
      pageSize: "apple",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("pageSize must be greater than 0");
  });

  it("then it should send 400 if pageSize is not a number", async () => {
    req.body = {
      status: "1",
      pageSize: 1001,
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      "pageSize must not be greater than 1000",
    );
  });

  it("then it should send 400 if from date is not a valid date", async () => {
    req.body = {
      status: "1",
      from: "not-a-date",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("From date is not a valid date");
  });

  it("then it should send 400 if to date is not a valid date", async () => {
    req.body = {
      status: "1",
      to: "not-a-date",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("To date is not a valid date");
  });

  it("then it should send 400 if from date is in the future", async () => {
    req.body = {
      status: "1",
      from: "2099-12-30",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      "Date range should not be in the future",
    );
  });

  it("then it should send 400 if from and to date are in the future", async () => {
    req.body = {
      status: "1",
      from: "2099-12-01",
      to: "2099-12-30",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      "Date range should not be in the future",
    );
  });

  it("then it should send 400 if from date is further in the future than the to date", async () => {
    req.body = {
      status: "1",
      from: "2024-12-30",
      to: "2024-12-01",
    };
    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("From date greater than to date");
  });

  it("then it should send 500 if service found", async () => {
    servicesStorage.getUsersOfServiceByUserIds
      .mockReset()
      .mockImplementation(() => {
        throw new Error("Sequelize error");
      });

    await getAllServiceUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
