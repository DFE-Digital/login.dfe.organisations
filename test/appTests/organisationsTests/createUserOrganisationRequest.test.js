jest.mock("./../../../src/infrastructure/config", () => {
  const singleton = {};
  return () => singleton;
});
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    createUserOrgRequest: jest.fn(),
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

const {
  createUserOrgRequest,
  getApproversForOrg,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const createUserOrganisationRequest = require("./../../../src/app/organisations/createUserOrganisationRequest");

describe("when creating a user organisation request for an organisation with approvers", () => {
  let req;

  beforeEach(() => {
    req = {
      params: {
        id: "org1",
        uid: "user1",
      },
      body: {
        reason: "Test",
        status: 0,
      },
    };

    res.mockResetAll();
    createUserOrgRequest.mockReset().mockReturnValue("some-new-id");
    getApproversForOrg.mockReset().mockImplementation((org) => {
      return [
        {
          user_id: "user2",
          organisation_id: org,
        },
        {
          user_id: "user3",
          organisation_id: org,
        },
      ];
    });
  });

  it("then it should create user org request in storage", async () => {
    await createUserOrganisationRequest(req, res);

    expect(createUserOrgRequest.mock.calls).toHaveLength(1);
    expect(createUserOrgRequest.mock.calls[0][0]).toEqual({
      organisationId: "org1",
      reason: "Test",
      status: 0,
      userId: "user1",
    });
  });

  it("then the requestId is returned in the response", async () => {
    await createUserOrganisationRequest(req, res);

    expect(res.send).toHaveBeenCalledWith("some-new-id");
  });

  it("then it should return 201 if user request was created", async () => {
    await createUserOrganisationRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
