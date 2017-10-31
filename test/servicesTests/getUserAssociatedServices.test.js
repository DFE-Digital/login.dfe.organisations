jest.mock('./../../src/app/services/data/servicesStorage');
jest.mock('./../../src/infrastructure/logger');

const httpMocks = require('node-mocks-http');
const getUserAssociatedServices = require('./../../src/app/services/getUserAssociatedServices');

describe('When getting associated services to a user', () => {
  let req;
  let res;
  let servicesStorage;
  let getUserServicesStub;
  let logger;
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

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({  }));

    servicesStorage = require('./../../src/app/services/data/servicesStorage');
    servicesStorage.mockImplementation(() => ({
      getUserAssociatedServices: getUserServicesStub
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
  it('then a 500 response is returned when an error is thrown', async () => {
    getUserServicesStub = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await getUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(500);
  });
});