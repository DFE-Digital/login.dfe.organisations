jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getOrganisationsForUserIncludingServices: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const logger = require('./../../../src/infrastructure/logger');
const { getOrganisationsForUserIncludingServices } = require('./../../../src/app/organisations/data/organisationsStorage');
const getOrganisationsAssociatedWithUser = require('./../../../src/app/organisations/getOrganisationsAssociatedWithUser');

const userOrgMapping = [{
  organisation: {
    id: 'org1',
    name: 'Organisation One',
  },
  role: {
    id: 0,
    name: 'End User',
  },
  approvers: ['user2'],
  services: [{
    id: 'service1',
    name: 'Service One',
    externalIdentifiers: [],
  }],
}];

describe('when getting organisations associated with a user', () => {
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

    getOrganisationsForUserIncludingServices.mockReset().mockReturnValue(userOrgMapping);
  });

  it('then it should get user org mapping from storage', async () => {
    await getOrganisationsAssociatedWithUser(req, res);

    expect(getOrganisationsForUserIncludingServices.mock.calls).toHaveLength(1);
    expect(getOrganisationsForUserIncludingServices.mock.calls[0][0]).toBe('user1');
  });

  it('then it should return user mapping from storage as json', async () => {
    await getOrganisationsAssociatedWithUser(req, res);

    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(userOrgMapping);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should log errors and return 500 result', async () => {
    getOrganisationsForUserIncludingServices.mockReset().mockImplementation(() => {
      throw new Error('test');
    });

    await getOrganisationsAssociatedWithUser(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });
});
