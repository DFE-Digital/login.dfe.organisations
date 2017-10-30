jest.mock('./../../src/app/services/data/servicesStorage');

const httpMocks = require('node-mocks-http');
const getUserAssociatedServices = require('../../src/app/services/api/getUserAssociatedServices');

describe('When getting associated services to a user', () => {
  let req;
  let res;
  let servicesStorage;
  let getUserServicesStub;
  const expectedUserId = '7654321';
  const expectedServiceName = 'service 1';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        uid: expectedUserId
      }
    };

    getUserServicesStub = jest.fn().mockImplementation(() => {
      return {
        services: [
          {
            name: expectedServiceName,
          }
        ]
      };
    });

    servicesStorage = require('./../../src/app/services/data/servicesStorage');
    servicesStorage.mockImplementation(() => ({
      getUserServices: getUserServicesStub
    }));
  });
  it('then a bad request is returned if the userid is not supplied', async () => {
    const uidValues = ['', undefined, null];

    await Promise.all(uidValues.map(async (valueToUse) => {
      req.params.uid = valueToUse;

      await getUserAssociatedServices(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then if the request is valid the services storage service is called', async () => {
    await getUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(200);
    expect(getUserServicesStub.mock.calls[0][0]).toBe(expectedUserId);
  });
  it('then if the request is valid and no data is returned a 404 is returned', async () => {
    getUserServicesStub = jest.fn().mockImplementation(() => {
      return null
    });
    req.params.uid = 'ABC123';

    await getUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(404);
    expect(getUserServicesStub.mock.calls[0][0]).toBe('ABC123');
  });
  it('then if the request is valid the data is returned in the response', async () => {
    await getUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData().services[0].name).toBe(expectedServiceName);
  });
});