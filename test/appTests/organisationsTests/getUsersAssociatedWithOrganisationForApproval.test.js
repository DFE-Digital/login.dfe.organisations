jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getUsersAssociatedWithOrganisationForApproval: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const logger = require('./../../../src/infrastructure/logger');
const { getUsersAssociatedWithOrganisationForApproval } = require('./../../../src/app/organisations/data/organisationsStorage');
const get = require('./../../../src/app/organisations/getUsersAssociatedWithOrganisationForApproval');

const userOrgMapping = [{
  organisation: {
    id: 'org1',
    name: 'Organisation One',
  },
  role: {
    id: 0,
    name: 'End User',
  },
  userId: 'user1',
}];

describe('when getting users associated to organisations for approval', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        uid: 'user1',
      },
    };

    res = httpMocks.createResponse();

    logger.error.mockReset();

    getUsersAssociatedWithOrganisationForApproval.mockReset().mockReturnValue(userOrgMapping);
  });

  it('then it should get user from organisations for approval', async () => {
    await get(req, res);

    expect(getUsersAssociatedWithOrganisationForApproval.mock.calls).toHaveLength(1);
    expect(getUsersAssociatedWithOrganisationForApproval.mock.calls[0][0]).toBe('user1');
  });

  it('then it should return user mapping from storage as json', async () => {
    await get(req, res);

    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(userOrgMapping);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should log errors and return 500 result', async () => {
    getUsersAssociatedWithOrganisationForApproval.mockReset().mockImplementation(() => {
      throw new Error('test');
    });

    await get(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });
});
