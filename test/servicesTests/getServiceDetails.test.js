'use strict';

/* eslint-disable global-require */

jest.mock('./../../src/app/services/data/servicesStorage', () => {
  const getById = jest.fn();
  const getServiceDetails = jest.fn();
  return {
    getById: jest.fn().mockImplementation(getById),
    getServiceDetails: jest.fn().mockImplementation(getServiceDetails),
  };
});
jest.mock('./../../src/infrastructure/repository', () => {
  const SequalizeMock = require('sequelize-mock');
  return new SequalizeMock();
});

const servicesStorage = require('./../../src/app/services/data/servicesStorage');
const getServiceDetails = require('./../../src/app/services/getServiceDetails');
const httpMocks = require('node-mocks-http');


describe('when getting users of services', () => {
  let req;
  const res = httpMocks.createResponse();

  beforeEach(() => {
    req = {
      params: {
        sid: '9d672383-cf21-49b4-86d2-7cea955ad422',
        org_id: '1d672383-cf21-49b4-86d2-7cea955ad422',
      },
    };

    servicesStorage.getById.mockReset();
    servicesStorage.getServiceDetails.mockReset();

    servicesStorage.getServiceDetails.mockReturnValue(
      {
        id: 'service1',
        name: 'service one',
        description: 'the first service',
      },
    );
    servicesStorage.getById.mockReturnValue(
      {
        id: 'service1',
        name: 'service one',
        description: 'the first service',
      },
    );
  });
  it('then it should send 404 if service not found', async () => {
    servicesStorage.getById.mockReset();
    servicesStorage.getServiceDetails.mockReset();

    servicesStorage.getServiceDetails.mockReturnValue(null);
    servicesStorage.getById.mockReturnValue(null);


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
  });
});
