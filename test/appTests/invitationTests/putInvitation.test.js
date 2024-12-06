jest.mock("./../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  };
});
jest.mock("./../../../src/app/invitations/data/invitationsStorage", () => {
  const upsert = jest.fn();
  return {
    upsert: jest.fn().mockImplementation(upsert),
  };
});

const invitationsStorage = require("./../../../src/app/invitations/data/invitationsStorage");
const httpMocks = require("node-mocks-http");
const putInvitation = require("./../../../src/app/invitations/putInvitation");

describe("when putting an invitation", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "60fa3608-f1a0-41d9-a0b5-32a2e04b6c59";

  beforeEach(() => {
    req = {
      params: {
        inv_id: "inv1",
        org_id: "org1",
        svc_id: "svc1",
      },
      body: {
        roleId: 99,
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    invitationsStorage.upsert.mockReset();
  });

  it("then it should upsert record with put data", async () => {
    await putInvitation(req, res);

    expect(invitationsStorage.upsert.mock.calls.length).toBe(1);
    expect(invitationsStorage.upsert.mock.calls[0][0]).toMatchObject({
      invitationId: "inv1",
      organisationId: "org1",
      serviceId: "svc1",
      roleId: 99,
    });
    expect(invitationsStorage.upsert.mock.calls[0][1]).toBe(
      expectedRequestCorrelationId,
    );
  });

  it("then it should return a 202 response", async () => {
    await putInvitation(req, res);

    expect(res.statusCode).toBe(202);
    expect(res._isEndCalled()).toBe(true);
  });
});
