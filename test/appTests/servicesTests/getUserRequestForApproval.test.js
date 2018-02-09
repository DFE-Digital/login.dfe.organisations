'use strict';

/* eslint-disable global-require */

jest.mock('./../../../src/app/services/data/servicesStorage', () => {
  const getUserService = jest.fn();
  return {
    getUserService: jest.fn().mockImplementation(getUserService),
  };
});
jest.mock('./../../../src/infrastructure/logger');
jest.mock('./../../../src/infrastructure/config');

jest.mock('./../../../src/infrastructure/repository', () => {
  const SequelizeMock = require('sequelize-mock');
  return new SequelizeMock();
});
const servicesStorage = require('./../../../src/app/services/data/servicesStorage');
const httpMocks = require('node-mocks-http');
const getUserRequestForApproval = require('./../../../src/app/services/getUserRequestForApproval');

describe('When getting an approval request', () => {
  let req;
  let res;
  let logger;
  const expectedServiceId = '7654321';
  const expectedOrgId = '21FDE45';
  const expectedUserId = 'FRV434321';
  const expectedServiceName = 'service 1';
  const expectedRequestCorrelationId = '392f0e46-787b-41bc-9e77-4c3cb94824bb';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        sid: expectedServiceId,
        org_id: expectedOrgId,
        uid: expectedUserId,
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    logger = require('./../../../src/infrastructure/logger/index');
    logger.error = (() => ({}));

    servicesStorage.getUserService.mockReset();

    servicesStorage.getUserService.mockReturnValue(
      { userServiceRequest:
        {
          name: expectedServiceName,
        },
      },
    );
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then if the serviceId is not passed a bad request is returned', async () => {
    const serviceIdValues = ['', undefined, null];

    await Promise.all(serviceIdValues.map(async (valueToUse) => {
      req.params.sid = valueToUse;

      await getUserRequestForApproval(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then if the orgid is not passed a bad request is returned', async () => {
    const orgIdValues = ['', undefined, null];

    await Promise.all(orgIdValues.map(async (valueToUse) => {
      req.params.org_id = valueToUse;

      await getUserRequestForApproval(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then if the userid is not passed a bad request is returned', async () => {
    const userIdValues = ['', undefined, null];

    await Promise.all(userIdValues.map(async (valueToUse) => {
      req.params.uid = valueToUse;

      await getUserRequestForApproval(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then the data is retrieved from the services storage', async () => {
    await getUserRequestForApproval(req, res);

    expect(res.statusCode).toBe(200);
    expect(servicesStorage.getUserService.mock.calls[0][0]).toBe(expectedServiceId);
    expect(servicesStorage.getUserService.mock.calls[0][1]).toBe(expectedOrgId);
    expect(servicesStorage.getUserService.mock.calls[0][2]).toBe(expectedUserId);
    expect(servicesStorage.getUserService.mock.calls[0][3]).toBe(expectedRequestCorrelationId);
  });
  it('then if the request is valid and no data is returned a 404 is returned', async () => {
    servicesStorage.getUserService.mockReset();
    servicesStorage.getUserService.mockReturnValue(null);

    req.params.sid = 'ABC123';

    await getUserRequestForApproval(req, res);

    expect(res.statusCode).toBe(404);
  });
  it('then a 500 response is returned when an error is thrown', async () => {
    servicesStorage.getUserService.mockReset();
    servicesStorage.getUserService = () => { throw new Error(); };

    await getUserRequestForApproval(req, res);

    expect(res.statusCode).toBe(500);
  });
});
