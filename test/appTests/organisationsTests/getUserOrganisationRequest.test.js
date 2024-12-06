jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    getUserOrgRequestById: jest.fn(),
  };
});

const {
  getUserOrgRequestById,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const getUserOrganisationRequest = require("./../../../src/app/organisations/getUserOrganisationRequest");

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
describe("when getting a request by Id", () => {
  let req;

  beforeEach(() => {
    res.mockResetAll();
    req = {
      params: {
        rid: "requestId",
      },
    };

    getUserOrgRequestById.mockReset().mockReturnValue({
      id: "requestId",
      user_id: "userId",
      organisation_id: "org1",
      reason: "reason for request",
    });
  });
  it("then it should get the request by id from storage", async () => {
    await getUserOrganisationRequest(req, res);

    expect(getUserOrgRequestById.mock.calls).toHaveLength(1);
    expect(getUserOrgRequestById.mock.calls[0][0]).toBe("requestId");
  });
  it("then it should return request mapping from storage as json", async () => {
    await getUserOrganisationRequest(req, res);

    expect(res.send).toHaveBeenCalledWith({
      id: "requestId",
      user_id: "userId",
      organisation_id: "org1",
      reason: "reason for request",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("then it should return 404 if request not found", async () => {
    getUserOrgRequestById.mockReset().mockReturnValue(undefined);

    await getUserOrganisationRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
