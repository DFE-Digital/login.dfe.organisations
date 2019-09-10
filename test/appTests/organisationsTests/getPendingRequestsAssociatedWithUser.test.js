jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getRequestsAssociatedWithUser: jest.fn(),
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
const logger = require('./../../../src/infrastructure/logger');
const { getRequestsAssociatedWithUser } = require('./../../../src/app/organisations/data/organisationsStorage');
const getPendingRequestsAssociatedWithUser = require('../../../src/app/organisations/getPendingRequestsAssociatedWithUser');


describe('when getting pending requests for a user', () => {
  let req;
  const expectedRequestCorrelationId = '392f0e46-787b-41bc-9e77-4c3cb94824bb';

  beforeEach(() => {
    res.mockResetAll();
    req = {
      params: {
        id: '1d672383-cf21-49b4-86d2-7cea955ad422',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    getRequestsAssociatedWithUser.mockReset();

    getRequestsAssociatedWithUser.mockReturnValue(
      [{
        id: 'requestId',
        org_id: 'org1',
        org_name: 'org name',
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: 'Open',
        },
        user_id: 'user 1',
        created_at: '12/12/2019',
        status: {
          id: 0,
          name: 'pending',
        },
      }],
    );
  });

  it('then it should return 200 if requests found', async () => {
    await getPendingRequestsAssociatedWithUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('then it should send pending requests for user in response', async () => {
    await getPendingRequestsAssociatedWithUser(req, res);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
      [{
        id: 'requestId',
        org_id: 'org1',
        org_name: 'org name',
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: 'Open',
        },
        user_id: 'user 1',
        created_at: '12/12/2019',
        status: {
          id: 0,
          name: 'pending',
        },
      }],
    );
  });

  it('then it should log errors and return 500 result', async () => {
    getRequestsAssociatedWithUser.mockReset().mockImplementation(() => {
      throw new Error('test');
    });

    await getPendingRequestsAssociatedWithUser(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
