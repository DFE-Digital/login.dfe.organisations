jest.mock('./../../../src/app/services/data/servicesStorage', () => ({
  list: jest.fn(),
}));

const httpMocks = require('node-mocks-http');
const { list } = require('./../../../src/app/services/data/servicesStorage');
const listServices = require('./../../../src/app/services/listServices');

const services = [
  {
    id: 'svc1',
    name: 'Service One',
    description: 'The first services',
  },
  {
    id: 'svc2',
    name: 'Service Two',
    description: 'The second services',
  },
  {
    id: 'svc3',
    name: 'Service Three',
    description: 'The third services',
  },
];

describe('when listing services', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      get: () => 'some-correlation-id',
    };

    res = httpMocks.createResponse();

    list.mockReset().mockReturnValue(services);
  });

  it('then it should get services from storage with correlation id from headers', async () => {
    await listServices(req, res);

    expect(list.mock.calls).toHaveLength(1);
    expect(list.mock.calls[0][0]).toBe('some-correlation-id');
  });

  it('then it should return json representation of services from storage', async () => {
    await listServices(req, res);

    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(services);
    expect(res._isEndCalled()).toBe(true);
  });
});
