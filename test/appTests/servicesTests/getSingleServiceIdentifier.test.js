jest.mock('./../../../src/app/services/data/servicesStorage', () => {
  return {
    getExternalIdentifier: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { getExternalIdentifier } = require('./../../../src/app/services/data/servicesStorage');
const getSingleServiceIdentifier = require('./../../../src/app/services/getSingleServiceIdentifier');

describe('when getting a single service identifer using service id, identifier key and value', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      header: () => 'correlation-id',
      params: {
        sid: 'svc1',
        id_key: 'k2s-id',
        id_value: '1234567',
      },
    };

    res = httpMocks.createResponse();

    getExternalIdentifier.mockReset();
    getExternalIdentifier.mockReturnValue({
      userId: 'usr1',
      serviceId: 'svc1',
      organisationId: 'org1',
      key: 'k2s-id',
      value: '1234567',
    });
  });

  it('then it should get identifier using requested values', async () => {
    await getSingleServiceIdentifier(req, res);

    expect(getExternalIdentifier.mock.calls).toHaveLength(1);
    expect(getExternalIdentifier.mock.calls[0][0]).toBe(req.params.sid);
    expect(getExternalIdentifier.mock.calls[0][1]).toBe(req.params.id_key);
    expect(getExternalIdentifier.mock.calls[0][2]).toBe(req.params.id_value);
    expect(getExternalIdentifier.mock.calls[0][3]).toBe('correlation-id');
  });

  it('then it should return identifer', async () => {
    await getSingleServiceIdentifier(req, res);

    expect(res._getData()).toMatchObject({
      userId: 'usr1',
      serviceId: 'svc1',
      organisationId: 'org1',
      key: 'k2s-id',
      value: '1234567',
    });
    expect(res._isJSON()).toBe(true);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 404 if not identifier found', async () => {
    getExternalIdentifier.mockReturnValue(null);

    await getSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });
});
