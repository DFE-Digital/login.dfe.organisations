'use strict';

/* eslint-disable global-require */

jest.mock('./../../src/app/services/data/servicesStorage');
jest.mock('./../../src/infrastructure/repository', () => {
  const SequalizeMock = require('sequelize-mock');
  return new SequalizeMock();
});

const getServiceUsers = require('./../../src/app/services/getServiceUsers');
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
        id: '',
        name: '',
        description: '',
      }),
      getUsersOfService: () => ([
        {
          id: 'user1',
          status: 54,
          role: {
            id: 12,
            name: 'user',
          },
        },
      ]),
    }));
  });

  it('then it should send 400 if service id is not a uuid', async () => {
    req.params.sid = 'not-a-uuid';

    await getServiceUsers(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 404 if service not found', async () => {
    servicesStorage.mockImplementation(() => ({
      getById: () => (null),
      getUsersOfService: () => ([]),
    }));

    await getServiceUsers(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 200 if service found', async () => {
    await getServiceUsers(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send users in response if service found', async () => {
    await getServiceUsers(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.length).toBe(1);
    expect(response[0].id).toBe('user1');
    expect(response[0].status).toBe(54);
    expect(response[0].role.id).toBe(12);
    expect(response[0].role.name).toBe('user');
  })
});
