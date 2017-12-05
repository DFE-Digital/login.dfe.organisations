jest.mock('./../../../src/infrastructure/logger', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  };
});
jest.mock('./../../../src/app/invitations/data/invitationsStorage', () => {
  const getForInvitationId = jest.fn();
  return {
    getForInvitationId: jest.fn().mockImplementation(getForInvitationId),
  };
});

const serviceMapping1 = {
  invitationId: 'sdafsadfsdf',
  role: {
    id: 0,
    name: 'end user',
  },
  service: {
    id: 'svc1',
    name: 'service 1',
  },
  organisation: {
    id: 'org1',
    name: 'organisation 1',
  },
};

const invitationsStorage = require('./../../../src/app/invitations/data/invitationsStorage');
const httpMocks = require('node-mocks-http');
const getInvitation = require('./../../../src/app/invitations/getInvitation');

describe('when getting an invitation', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        inv_id: 'inv1',
      },
    };

    res = httpMocks.createResponse();

    invitationsStorage.getForInvitationId.mockReset();
    invitationsStorage.getForInvitationId.mockReturnValue([
      serviceMapping1,
    ]);
  });

  it('then it should return services from storage', async () => {
    await getInvitation(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res.statusCode).toBe(200);
    const data = res._getData();
    expect(data).not.toBeNull();
    expect(data.length).toBe(1);
    expect(data[0]).toMatchObject(serviceMapping1);
  });

  it('then it should return 404 response if invitation service not found', async () => {
    invitationsStorage.getForInvitationId.mockReturnValue(null);

    await getInvitation(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res.statusCode).toBe(404);
  });
});