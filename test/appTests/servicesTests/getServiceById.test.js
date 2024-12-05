"use strict";

/* eslint-disable global-require */

jest.mock("./../../../src/app/services/data/servicesStorage", () => {
  const getById = jest.fn();
  return {
    getById: jest.fn().mockImplementation(getById),
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
const getServiceById = require("./../../../src/app/services/getServiceById");
const httpMocks = require("node-mocks-http");

describe("when getting users of services", () => {
  let req;
  const res = httpMocks.createResponse();
  const expectedRequestCorrelationId = "392f0e46-787b-41bc-9e77-4c3cb94824bb";

  beforeEach(() => {
    req = {
      params: {
        sid: "9d672383-cf21-49b4-86d2-7cea955ad422",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    servicesStorage.getById.mockReset();

    servicesStorage.getById.mockReturnValue({
      id: "service1",
      name: "service one",
      description: "the first service",
    });
  });
  it("then it should send 404 if service not found", async () => {
    servicesStorage.getById.mockReset();
    servicesStorage.getById.mockReturnValue(null);

    await getServiceById(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send 200 if service found", async () => {
    await getServiceById(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should send service in response if service found", async () => {
    await getServiceById(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.id).toBe("service1");
    expect(response.name).toBe("service one");
    expect(response.description).toBe("the first service");
  });
  it("then the correct params are passed to the storage provider", async () => {
    await getServiceById(req, res);

    expect(servicesStorage.getById.mock.calls[0][0]).toBe(
      "9d672383-cf21-49b4-86d2-7cea955ad422",
    );
    expect(servicesStorage.getById.mock.calls[0][1]).toBe(
      expectedRequestCorrelationId,
    );
  });
});
