jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    getLatestActionedRequestAssociated: jest.fn(),
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
  getLatestActionedRequestAssociated,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const getLatestRequestAssociatedWithUser = require("../../../src/app/organisations/getLatestActionedRequestAssociatedWithUser");

describe("when getting latest request for a user", () => {
  let req;
  const expectedRequestCorrelationId = "392f0e46-787b-41bc-9e77-4c3cb94824bb";

  beforeEach(() => {
    res.mockResetAll();
    req = {
      params: {
        id: "1d672383-cf21-49b4-86d2-7cea955ad422",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    getLatestActionedRequestAssociated.mockReset();

    getLatestActionedRequestAssociated.mockReturnValue([
      {
        id: "requestId",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: -1,
          name: "rejected",
        },
      },
    ]);
  });

  it("then it should return 200 if requests found", async () => {
    await getLatestRequestAssociatedWithUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("then it should send latest request for user in response", async () => {
    await getLatestRequestAssociatedWithUser(req, res);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith([
      {
        id: "requestId",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: -1,
          name: "rejected",
        },
      },
    ]);
  });

  it("then it should log errors and return 500 result", async () => {
    getLatestActionedRequestAssociated.mockReset().mockImplementation(() => {
      throw new Error("test");
    });

    await getLatestRequestAssociatedWithUser(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
