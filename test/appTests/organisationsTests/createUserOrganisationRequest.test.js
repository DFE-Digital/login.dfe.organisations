const { mockConfig } = require("../../utils");
const {
  createUserOrgRequest,
  getApproversForOrg,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const createUserOrganisationRequest = require("./../../../src/app/organisations/createUserOrganisationRequest");
const { getUsersRaw } = require("login.dfe.api-client/users");

jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn(),
}));

jest.mock("./../../../src/infrastructure/config", () => mockConfig());
jest.mock("./../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
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
    getUsersRaw.mockReset().mockReturnValue([
      {
        sub: "user2",
        given_name: "ActiveName",
        family_name: "UserLastName",
        email: "activeUser@gmail.com",
        job_title: null,
        status: 1,
        phone_number: null,
        last_login: "2020-02-19T08:53:00.000Z",
        prev_login: null,
        isEntra: false,
        entraOid: null,
        entraLinked: null,
        isInternalUser: false,
        entraDeferUntil: null,
      },
      {
        sub: "user3",
        given_name: "DeactivatedName",
        family_name: "UserLastName",
        email: "deactivatedUser@gmail.com",
        job_title: null,
        status: 0,
        phone_number: null,
        last_login: "2020-02-19T08:53:00.000Z",
        prev_login: null,
        isEntra: false,
        entraOid: null,
        entraLinked: null,
        isInternalUser: false,
        entraDeferUntil: null,
      },
    ]);

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

  it("returns 400 if one of the params are missing", async () => {
    req = {
      params: {
        id: "org1",
      },
      body: {
        reason: "Test",
        status: 0,
      },
    };
    await createUserOrganisationRequest(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
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

  it("the request will be created with status 3 if the org has no approvers", async () => {
    getApproversForOrg.mockReset().mockReturnValue([]);

    await createUserOrganisationRequest(req, res);

    expect(createUserOrgRequest).toHaveBeenCalledTimes(1);
    expect(createUserOrgRequest.mock.calls[0][0]).toEqual({
      organisationId: "org1",
      reason: "Test",
      status: 3,
      userId: "user1",
    });
    expect(res.send).toHaveBeenCalledWith("some-new-id");
  });

  it("the request will be created with status 3 if the org has no active approvers", async () => {
    getUsersRaw.mockReset().mockReturnValue([
      {
        sub: "user2",
        given_name: "ActiveName",
        family_name: "UserLastName",
        email: "activeUser@gmail.com",
        job_title: null,
        status: 0,
        phone_number: null,
        last_login: "2020-02-19T08:53:00.000Z",
        prev_login: null,
        isEntra: false,
        entraOid: null,
        entraLinked: null,
        isInternalUser: false,
        entraDeferUntil: null,
      },
      {
        sub: "user3",
        given_name: "DeactivatedName",
        family_name: "UserLastName",
        email: "deactivatedUser@gmail.com",
        job_title: null,
        status: 0,
        phone_number: null,
        last_login: "2020-02-19T08:53:00.000Z",
        prev_login: null,
        isEntra: false,
        entraOid: null,
        entraLinked: null,
        isInternalUser: false,
        entraDeferUntil: null,
      },
    ]);

    await createUserOrganisationRequest(req, res);

    expect(createUserOrgRequest).toHaveBeenCalledTimes(1);
    expect(createUserOrgRequest.mock.calls[0][0]).toEqual({
      organisationId: "org1",
      reason: "Test",
      status: 3,
      userId: "user1",
    });
    expect(res.send).toHaveBeenCalledWith("some-new-id");
  });
});
