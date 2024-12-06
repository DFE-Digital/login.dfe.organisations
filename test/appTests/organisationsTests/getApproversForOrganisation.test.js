jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    getApproversForOrg: jest.fn(),
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
  getApproversForOrg,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const getApproversForOrganisation = require("./../../../src/app/organisations/getApproversForOrganisation");

describe("when getting approvers of organisations", () => {
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

    getApproversForOrg.mockReset();

    getApproversForOrg.mockReturnValue(["user1"]);
  });

  it("then it should send 200 if organisation found", async () => {
    await getApproversForOrganisation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("then it should send approvers in response if organisation found", async () => {
    await getApproversForOrganisation(req, res);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(["user1"]);
  });

  it("then it should log errors and return 500 result", async () => {
    getApproversForOrg.mockReset().mockImplementation(() => {
      throw new Error("test");
    });

    await getApproversForOrganisation(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
