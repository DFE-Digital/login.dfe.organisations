jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getUsersAssociatedWithOrganisation: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const logger = require('./../../../src/infrastructure/logger');
const { getUsersAssociatedWithOrganisation } = require('./../../../src/app/organisations/data/organisationsStorage');
const getUsersForOrg = require('./../../../src/app/organisations/getUsersForOrganisation');

describe('when getting users of organisations', () => {
  let req;
  const res = httpMocks.createResponse();
  const expectedRequestCorrelationId = '392f0e46-787b-41bc-9e77-4c3cb94824bb';

  beforeEach(() => {
    req = {
      params: {
        org_id: '1d672383-cf21-49b4-86d2-7cea955ad422',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    getUsersAssociatedWithOrganisation.mockReset();

    getUsersAssociatedWithOrganisation.mockReturnValue(
      [
        {
          id: 'user1',
          status: 54,
          role: {
            id: 12,
            name: 'user',
          },
          totalNumberOfPages: 1,
        },
      ],
    );
  });

  it('then it should send 200 if organisation found', async () => {
    await getUsersForOrg(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send users in response if organisation found', async () => {
    await getUsersForOrg(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.length).toBe(1);
    expect(response[0].id).toBe('user1');
    expect(response[0].status).toBe(54);
    expect(response[0].role.id).toBe(12);
    expect(response[0].role.name).toBe('user');
    expect(response[0].totalNumberOfPages).toBe(1);
  });

  it('then it should log errors and return 500 result', async () => {
    getUsersAssociatedWithOrganisation.mockReset().mockImplementation(() => {
      throw new Error('test');
    });

    await getUsersForOrg(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });
});
