"use strict";
/* eslint-disable global-require */

jest.mock('./../../src/app/services/data/servicesStorage');
jest.mock('./../../src/infrastructure/logger');
jest.mock('./../../src/infrastructure/config');

jest.mock('./../../src/infrastructure/repository', () => {
  const SequelizeMock = require('sequelize-mock');
  return new SequelizeMock();
});

const httpMocks = require('node-mocks-http');
const getUserRequestForApproval = require('./../../src/app/services/getUserRequestForApproval');

describe('When getting an approval request', () => {
  let req;
  let res;
  let servicesStorage;
  let getUserServiceByIdStub;
  let logger;
  const expectedUserServiceId = '7654321';
  const expectedServiceName = 'service 1';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        usid: expectedUserServiceId,
      },
    };

    getUserServiceByIdStub = jest.fn().mockImplementation(() => ({
      userServiceRequest:
        {
          name: expectedServiceName,
        },
    }));

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({}));

    servicesStorage = require('./../../src/app/services/data/servicesStorage');
    servicesStorage.mockImplementation(() => ({
      getUserServiceById: getUserServiceByIdStub,
    }));
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then if the uid is not passed a bad request is returned', async () => {
    const usidValues = ['', undefined, null];

    await Promise.all(usidValues.map(async (valueToUse) => {
      req.params.usid = valueToUse;

      await getUserRequestForApproval(req, res);
      expect(res.statusCode).toBe(400);
    }));

  });
  it('then the data is retrieved from the services storage', async () => {
    await getUserRequestForApproval(req, res);

    expect(res.statusCode).toBe(200);
    expect(getUserServiceByIdStub.mock.calls[0][0]).toBe(expectedUserServiceId);
  });
  it('then if the request is valid and no data is returned a 404 is returned', async () => {
    getUserServiceByIdStub = jest.fn().mockImplementation(() => null);
    req.params.usid = 'ABC123';

    await getUserRequestForApproval(req, res);

    expect(res.statusCode).toBe(404);

  });
  it('then a 500 response is returned when an error is thrown', async () => {
    getUserServiceByIdStub = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await getUserRequestForApproval(req, res);

    expect(res.statusCode).toBe(500);
  })
});