jest.mock('./../../../src/infrastructure/logger', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  };
});
jest.mock('./../../../src/app/services/data/servicesStorage', () => {
  const upsert = jest.fn();
  return {
    upsertExternalIdentifier: jest.fn().mockImplementation(upsert),
  };
});


const servicesStorage = require('./../../../src/app/services/data/servicesStorage');
const httpMocks = require('node-mocks-http');
const putSingleServiceIdentifier = require('./../../../src/app/services/putSingleServiceIdentifier');

describe('when putting a single service identifier', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = '60fa3608-f1a0-41d9-a0b5-32a2e04b6c59';

  beforeEach(() => {
    req = {
      params: {
        uid: 'user1',
        org_id: 'org1',
        sid: 'svc1',
      },
      body: {
        idKey: 'key1',
        idValue: 'value1',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    servicesStorage.upsertExternalIdentifier.mockReset();

  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then it should upsert record with put data', async () => {
    await putSingleServiceIdentifier(req, res);

    expect(servicesStorage.upsertExternalIdentifier.mock.calls.length).toBe(1);
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][0]).toBe('svc1');
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][1]).toBe('user1');
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][2]).toBe('org1');
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][3]).toBe('key1');
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][4]).toBe('value1');
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][5]).toBe(expectedRequestCorrelationId);
  });

  it('then if the body key value is not supplied a bad request is returned', async () => {

    req.body = { };

    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('then it should return a 202 response', async () => {
    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(202);

  });
});
