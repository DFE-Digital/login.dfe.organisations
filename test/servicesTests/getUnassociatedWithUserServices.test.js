'use strict';


/* eslint-disable global-require */

jest.mock('./../../src/app/services/data/servicesStorage', () => {
  const getUserUnassociatedServices = jest.fn();
  return {
    getUserUnassociatedServices: jest.fn().mockImplementation(getUserUnassociatedServices),
  };
});

jest.mock('./../../src/infrastructure/logger');
jest.mock('./../../src/infrastructure/repository', () => {
  const SequalizeMock = require('sequelize-mock');
  return new SequalizeMock();
});

const servicesStorage = require('./../../src/app/services/data/servicesStorage');
const httpMocks = require('node-mocks-http');
const getUnassociatedUserAssociatedServices = require('./../../src/app/services/getUserUnassociatedServices');

describe('When getting services available to a user', () => {
  let req;
  let res;
  let logger;
  const expectedUserId = '7654321';
  const expectedServiceName = 'service 1';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        uid: expectedUserId,
      },
    };

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({ }));

    servicesStorage.getUserUnassociatedServices.mockReset();

    servicesStorage.getUserUnassociatedServices.mockReturnValue(
      { services: [
        {
          name: expectedServiceName,
        },
      ],
      },
    );
  });
  it('then a bad request is returned if the userid is not supplied', async () => {
    const uidValues = ['', undefined, null];

    await Promise.all(uidValues.map(async (valueToUse) => {
      req.params.uid = valueToUse;

      await getUnassociatedUserAssociatedServices(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then if the request is valid the services storage service is called', async () => {
    await getUnassociatedUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(200);
    expect(servicesStorage.getUserUnassociatedServices.mock.calls[0][0]).toBe(expectedUserId);
  });
  it('then if the request is valid and no data is returned a 404 is returned', async () => {
    servicesStorage.getUserUnassociatedServices.mockReset();
    servicesStorage.getUserUnassociatedServices.mockReturnValue(null);
    req.params.uid = 'ABC123';

    await getUnassociatedUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(404);
    expect(servicesStorage.getUserUnassociatedServices.mock.calls[0][0]).toBe('ABC123');
  });
  it('then if the request is valid the data is returned in the response', async () => {
    await getUnassociatedUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData().services[0].name).toBe(expectedServiceName);
  });
  it('then a 500 response is returned when an error is thrown', async () => {
    servicesStorage.getUserUnassociatedServices.mockReset();
    servicesStorage.getUserUnassociatedServices = () => { throw new Error(); };

    await getUnassociatedUserAssociatedServices(req, res);

    expect(res.statusCode).toBe(500);
  });
});
