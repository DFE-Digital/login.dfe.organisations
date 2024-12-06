jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    getServiceAndSubServiceReqForOrgs: jest.fn(),
  };
});

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

const logger = require("./../../../src/infrastructure/logger");
const {
  getServiceAndSubServiceReqForOrgs,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const getOrgsServicesSubServicesRequest = require("../../../src/app/organisations/getOrgsServicesSubServicesRequests");

describe("When getting all pending sub-service and service request for organisations", () => {
  let req;
  const expectedRequestCorrelationId = "392f0e46-787b-41bc-9e77-4c3cb94824bb";
  const orgIds = [
    "1d672383-cf21-49b4-86d2-7cea955ad422",
    "1d672383-cf21-49b4-86d2-7cea955ad421",
  ];
  const pagedResult = {
    requests: [
      {
        id: "requestId1",
        org_id: "1d672383-cf21-49b4-86d2-7cea955ad422",
        org_name: "Organisation Test One",
        user_id: "user_id_11",
        service_id: "service_id",
        role_ids: "role_ids",
        created_date: "2023-04-24T12:01:48.994Z",
        request_type: { id: "service", name: "Service access" },
        status: {
          id: 0,
          name: "Pending",
        },
      },
      {
        id: "requestId3",
        org_id: "1d672383-cf21-49b4-86d2-7cea955ad421",
        org_name: "Organisation Test Two",
        user_id: "user_id_11",
        service_id: "service_id",
        role_ids: "role_ids",
        created_date: "2023-04-24T12:01:48.994Z",
        request_type: { id: "sub-service", name: "Sub-service access" },
        status: {
          id: 0,
          name: "Pending",
        },
      },
    ],
  };

  beforeEach(() => {
    res.mockResetAll();
    req = {
      params: {
        orgIds,
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    getServiceAndSubServiceReqForOrgs.mockReset();

    getServiceAndSubServiceReqForOrgs.mockReturnValue(pagedResult);
  });

  it("then it should query for service and sub-service requests associated with multiple organisations by orgIds", async () => {
    await getOrgsServicesSubServicesRequest(req, res);

    expect(getServiceAndSubServiceReqForOrgs).toHaveBeenCalledTimes(1);
    expect(getServiceAndSubServiceReqForOrgs).toHaveBeenCalledWith(orgIds);
  });

  it("then it should send 200 if valid request", async () => {
    await getOrgsServicesSubServicesRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("then it should send all service and sub-service requests for organisations in response if organisations found", async () => {
    await getOrgsServicesSubServicesRequest(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(pagedResult);
  });

  it("then it should log errors and return 500 result if any errors", async () => {
    getServiceAndSubServiceReqForOrgs.mockReset().mockImplementation(() => {
      throw new Error("Sequelize error");
    });
    await getOrgsServicesSubServicesRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(logger.error.mock.calls).toHaveLength(1);
    expect(logger.error.mock.calls[0][0]).toEqual(
      "Error getting service and sub-service requests for organisation 1d672383-cf21-49b4-86d2-7cea955ad422,1d672383-cf21-49b4-86d2-7cea955ad421 - Sequelize error",
    );
  });
});
