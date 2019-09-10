jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getAllRequestsEscalatedToSupport: jest.fn(),
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
const { getAllRequestsEscalatedToSupport } = require('./../../../src/app/organisations/data/organisationsStorage');
const getRequestsForSupport = require('./../../../src/app/organisations/getRequestsForSupport');


describe('when getting requests that have been escalated to support', () => {
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

    getAllRequestsEscalatedToSupport.mockReset();

    getAllRequestsEscalatedToSupport.mockReturnValue(
      [{
        id: 'requestId',
        org_id: 'org1',
        org_name: 'org name',
        user_id: 'user 1',
        created_at: '12/12/2019',
        status: {
          id: 2,
          name: 'escalated',
        },
      }],
    );
  });

  it('then it should send 200 if escalated requests are found', async () => {
    await getRequestsForSupport(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('then it should send requests for org in response if escalated requests are found', async () => {
    await getRequestsForSupport(req, res);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
      [{
        id: 'requestId',
        org_id: 'org1',
        org_name: 'org name',
        user_id: 'user 1',
        created_at: '12/12/2019',
        status: {
          id: 2,
          name: 'escalated',
        },
      }],
    );
  });

  it('then it should log errors and return 500 result', async () => {
    getAllRequestsEscalatedToSupport.mockReset().mockImplementation(() => {
      throw new Error('test');
    });

    await getRequestsForSupport(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
