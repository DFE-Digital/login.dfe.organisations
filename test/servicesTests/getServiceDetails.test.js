'use strict';

/* eslint-disable global-require */

jest.mock('./../../src/app/services/data/servicesStorage');
jest.mock('./../../src/infrastructure/repository', () => {
  const SequalizeMock = require('sequelize-mock');
  return new SequalizeMock();
});

const getServiceDetails = require('./../../src/app/services/getServiceDetails');
const httpMocks = require('node-mocks-http');

describe('when getting users of services', () => {
  let req;
  const res = httpMocks.createResponse();
  let servicesStorage;

  beforeEach(() => {
    req = {
      params: {
        sid: '9d672383-cf21-49b4-86d2-7cea955ad422',
      },
    };

    servicesStorage = require('./../../src/app/services/data/servicesStorage');
    servicesStorage.mockImplementation(() => ({
      getById: () => ({
        id: 'service1',
        name: 'service one',
        description: 'the first service',
      }),
    }));
  });

  it('then it should send 404 if service not found', async () => {
    servicesStorage.mockImplementation(() => ({
      getById: () => (null),
      getUsersOfService: () => ([]),
    }));

    await getServiceDetails(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 200 if service found', async () => {
    await getServiceDetails(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send service in response if service found', async () => {
    await getServiceDetails(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.id).toBe('service1');
    expect(response.name).toBe('service one');
    expect(response.description).toBe('the first service');
  })
});
