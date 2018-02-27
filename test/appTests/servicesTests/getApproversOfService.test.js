'use strict';

/* eslint-disable global-require */

jest.mock('./../../../src/app/services/data/servicesStorage', () => {
  const getById = jest.fn();
  const getApproversOfServiceUserIds = jest.fn();
  return {
    getById: jest.fn().mockImplementation(getById),
    getApproversOfServiceUserIds: jest.fn().mockImplementation(getApproversOfServiceUserIds),
  };
});

jest.mock('./../../../src/infrastructure/repository', () => {
  const SequalizeMock = require('sequelize-mock');
  return new SequalizeMock();
});
jest.mock('./../../../src/infrastructure/logger', () => {
  return {};
});
const servicesStorage = require('./../../../src/app/services/data/servicesStorage');
const getApproversOfService = require('./../../../src/app/services/getApproversOfService');
const httpMocks = require('node-mocks-http');

describe('when getting users of services', () => {
  let req;
  const res = httpMocks.createResponse();
  const expectedRequestCorrelationId = '392f0e46-787b-41bc-9e77-4c3cb94824bb';

  beforeEach(() => {
    req = {
      params: {
        sid: '9d672383-cf21-49b4-86d2-7cea955ad422',
        org_id: '1d672383-cf21-49b4-86d2-7cea955ad422',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    servicesStorage.getById.mockReset();
    servicesStorage.getApproversOfServiceUserIds.mockReset();

    servicesStorage.getApproversOfServiceUserIds.mockReturnValue(
      [
        {
          id: 'user1',
        },
        {
          id: 'user2',
        },
      ],
    );
    servicesStorage.getById.mockReturnValue(
      {
        id: '',
        name: '',
        description: '',
      },
    );
  });

  it('then it should send 404 if service id is not a uuid', async () => {
    req.params.sid = 'not-a-uuid';

    await getApproversOfService(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 404 if service not found', async () => {
    servicesStorage.getById.mockReset();
    servicesStorage.getApproversOfServiceUserIds.mockReset();

    servicesStorage.getApproversOfServiceUserIds.mockReturnValue([]);
    servicesStorage.getById.mockReturnValue(null);


    await getApproversOfService(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 200 if service found', async () => {
    await getApproversOfService(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send users in response if service found', async () => {
    await getApproversOfService(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.length).toBe(2);
    expect(response[0].id).toBe('user1');
    expect(response[1].id).toBe('user2');
  });
  it('then the correct params are passed to the storage provider', async () => {
    await getApproversOfService(req, res);

    expect(servicesStorage.getById.mock.calls[0][0]).toBe('9d672383-cf21-49b4-86d2-7cea955ad422');
    expect(servicesStorage.getById.mock.calls[0][1]).toBe(expectedRequestCorrelationId);

    expect(servicesStorage.getApproversOfServiceUserIds.mock.calls[0][0]).toBe('1d672383-cf21-49b4-86d2-7cea955ad422');
    expect(servicesStorage.getApproversOfServiceUserIds.mock.calls[0][1]).toBe('9d672383-cf21-49b4-86d2-7cea955ad422');
    expect(servicesStorage.getApproversOfServiceUserIds.mock.calls[0][2]).toBe(expectedRequestCorrelationId);
  });
});
