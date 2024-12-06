jest.mock("./../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  };
});
jest.mock("./../../../src/app/invitations/data/invitationsStorage", () => {
  const getForInvitationId = jest.fn();
  return {
    getForInvitationId: jest.fn().mockImplementation(getForInvitationId),
  };
});

// const serviceMapping1 = {
//   invitationId: 'sdafsadfsdf',
//   role: {
//     id: 0,
//     name: 'end user',
//   },
//   service: {
//     id: 'svc1',
//     name: 'service 1',
//   },
//   organisation: {
//     id: 'org1',
//     name: 'organisation 1',
//   },
// };

const invitationDetails = {
  invitationId: "sdafsadfsdf",
  organisation: {
    id: "org1",
    name: "organisation 1",
  },
  role: {
    id: 0,
    name: "end user",
  },
  approvers: [],
  services: [
    {
      id: "svc1",
      name: "service 1",
    },
  ],
};

const invitationsStorage = require("./../../../src/app/invitations/data/invitationsStorage");
const httpMocks = require("node-mocks-http");
const getInvitation = require("./../../../src/app/invitations/getInvitation");

describe("when getting an invitation", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "3bd43d3b-7ead-40f0-b6b5-b31a64e9547d";

  beforeEach(() => {
    req = {
      params: {
        inv_id: "inv1",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    invitationsStorage.getForInvitationId.mockReset();
    invitationsStorage.getForInvitationId.mockReturnValue([invitationDetails]);
  });

  it("then it should map services from storage", async () => {
    await getInvitation(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res.statusCode).toBe(200);
    const data = res._getData();
    expect(data).not.toBeNull();
    expect(data.length).toBe(1);
    expect(data[0]).toMatchObject({
      invitationId: invitationDetails.invitationId,
      role: invitationDetails.role,
      service: {
        id: invitationDetails.services[0].id,
        name: invitationDetails.services[0].name,
      },
      organisation: invitationDetails.organisation,
      approvers: invitationDetails.approvers,
      externalIdentifiers: invitationDetails.services[0].externalIdentifiers,
    });
  });

  it("then it should return 404 response if invitation service not found", async () => {
    invitationsStorage.getForInvitationId.mockReturnValue(null);

    await getInvitation(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res.statusCode).toBe(404);
  });
  it("then the params are passed to the storage provider", async () => {
    await getInvitation(req, res);

    expect(invitationsStorage.getForInvitationId.mock.calls[0][0]).toBe("inv1");
    expect(invitationsStorage.getForInvitationId.mock.calls[0][1]).toBe(
      expectedRequestCorrelationId,
    );
  });
});
