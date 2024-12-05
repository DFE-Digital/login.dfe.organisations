"use strict";

/* eslint-disable global-require */

jest.mock("./../../../src/app/services/data/servicesStorage", () => {
  const getById = jest.fn();
  const getUsersOfService = jest.fn();
  return {
    getById: jest.fn().mockImplementation(getById),
    getUsersOfService: jest.fn().mockImplementation(getUsersOfService),
  };
});

jest.mock("./../../../src/infrastructure/repository", () => {
  const SequalizeMock = require("sequelize-mock");
  return new SequalizeMock();
});
jest.mock("./../../../src/infrastructure/logger", () => {
  return {};
});
const servicesStorage = require("./../../../src/app/services/data/servicesStorage");
const getServiceUsers = require("./../../../src/app/services/getServiceUsers");
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
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    servicesStorage.getById.mockReset();
    servicesStorage.getUsersOfService.mockReset();

    servicesStorage.getUsersOfService.mockReturnValue([
      {
        id: "user1",
        status: 54,
        role: {
          id: 12,
          name: "user",
        },
      },
    ]);
    servicesStorage.getById.mockReturnValue({
      id: "",
      name: "",
      description: "",
    });
  });

  it("then it should send 404 if service id is not a uuid", async () => {
    req.params.sid = "not-a-uuid";

    await getServiceUsers(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send 404 if service not found", async () => {
    servicesStorage.getById.mockReset();
    servicesStorage.getUsersOfService.mockReset();

    servicesStorage.getUsersOfService.mockReturnValue([]);
    servicesStorage.getById.mockReturnValue(null);

    await getServiceUsers(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send 200 if service found", async () => {
    await getServiceUsers(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send users in response if service found", async () => {
    await getServiceUsers(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.length).toBe(1);
    expect(response[0].id).toBe("user1");
    expect(response[0].status).toBe(54);
    expect(response[0].role.id).toBe(12);
    expect(response[0].role.name).toBe("user");
  });
  it("then the correct params are passed to the storage provider", async () => {
    await getServiceUsers(req, res);

    expect(servicesStorage.getById.mock.calls[0][0]).toBe(
      "9d672383-cf21-49b4-86d2-7cea955ad422",
    );
    expect(servicesStorage.getById.mock.calls[0][1]).toBe(
      expectedRequestCorrelationId,
    );

    expect(servicesStorage.getUsersOfService.mock.calls[0][0]).toBe(
      "1d672383-cf21-49b4-86d2-7cea955ad422",
    );
    expect(servicesStorage.getUsersOfService.mock.calls[0][1]).toBe(
      "9d672383-cf21-49b4-86d2-7cea955ad422",
    );
    expect(servicesStorage.getUsersOfService.mock.calls[0][2]).toBe(
      expectedRequestCorrelationId,
    );
  });
});
