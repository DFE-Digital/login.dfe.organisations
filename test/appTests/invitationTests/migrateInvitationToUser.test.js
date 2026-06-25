jest.mock("./../../../src/infrastructure/config", () => {
  const singleton = {};
  return () => singleton;
});
jest.mock("login.dfe.api-client/users", () => ({
  getUserRaw: jest.fn(),
}));
jest.mock("./../../../src/app/invitations/data/invitationsStorage", () => ({
  getForInvitationId: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => ({
  setUserAccessToOrganisation: jest.fn(),
}));
jest.mock("./../../../src/app/services/data/servicesStorage", () => ({
  upsertServiceUser: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/utils", () => ({
  getUserOrganisationIdentifiers: jest.fn(),
}));
jest.mock("login.dfe.jobs-client", () => ({
  NotificationClient: jest.fn().mockImplementation(() => ({
    sendServiceRequestApproved: jest.fn(),
  })),
}));

const httpMocks = require("node-mocks-http");
const { getUserRaw } = require("login.dfe.api-client/users");
const invitationsStorage = require("./../../../src/app/invitations/data/invitationsStorage");
const { setUserAccessToOrganisation } = require("./../../../src/app/organisations/data/organisationsStorage");
const { upsertServiceUser } = require("./../../../src/app/services/data/servicesStorage");
const { getUserOrganisationIdentifiers } = require("./../../../src/app/organisations/utils");
const migrateInvitationToUser = require("./../../../src/app/invitations/migrateInvitationToUser");

describe("when migrating an invitation to a user", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: { inv_id: "inv1" },
      body: { user_id: "user1" },
      headers: { "x-correlation-id": "corr-id-1" },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    getUserRaw.mockReset().mockResolvedValue({
      email: "user@example.com",
      given_name: "Test",
      family_name: "User",
    });

    invitationsStorage.getForInvitationId.mockReset().mockResolvedValue([
      {
        organisation: { id: "org1", name: "Org One" },
        role: { id: 3, name: "Approver" },
        services: [
          {
            id: "svc1",
            name: "Service One",
            externalIdentifiers: [],
            serviceRoles: [],
          },
        ],
      },
    ]);

    getUserOrganisationIdentifiers.mockReset().mockResolvedValue({
      numericIdentifier: 123456,
      textIdentifier: "userone",
    });

    setUserAccessToOrganisation.mockReset();
    upsertServiceUser.mockReset();
  });

  it("should pass numericIdentifier and textIdentifier in the correct argument positions to setUserAccessToOrganisation", async () => {
    await migrateInvitationToUser(req, res);

    expect(setUserAccessToOrganisation).toHaveBeenCalledTimes(1);
    const args = setUserAccessToOrganisation.mock.calls[0];
    expect(args[0]).toBe("org1");
    expect(args[1]).toBe("user1");
    expect(args[2]).toBe(3);
    expect(args[4]).toBe(123456);
    expect(args[5]).toBe("userone");
    expect(args).toHaveLength(6);
  });

  it("should return 202", async () => {
    await migrateInvitationToUser(req, res);

    expect(res.statusCode).toBe(202);
  });
});
