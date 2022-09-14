/* eslint-disable no-undef */
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getOrganisationsAssociatedToService: jest.fn(),
    pagedList: jest.fn(),
    search: jest.fn(),
    pagedSearch: jest.fn()
  };
});
jest.mock('./../../../src/app/services/data/servicesStorage', () => {
  const getById = jest.fn();
  return {
    getById: jest.fn().mockImplementation(getById)
  };
});
jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn()
}));

jest.mock('./../../../src/infrastructure/repository', () => {
  const SequalizeMock = require('sequelize-mock');
  return new SequalizeMock();
});
jest.mock('./../../../src/infrastructure/logger', () => {
  return {};
});
const servicesStorage = require('./../../../src/app/services/data/servicesStorage');

const httpMocks = require('node-mocks-http');
const { getOrganisationsAssociatedToService } = require('./../../../src/app/organisations/data/organisationsStorage');
const getOrganisationsAssociatedWithService = require('./../../../src/app/organisations/getOrganisationsAssociatedWithService');

const searchPage = [
  { id: 'org1' }
];
const searchNumberOfPages = 3;
const searchNumberOfRecords = 74;

describe('when listing or searching organisations associated with a service', () => {
  let req;
  let res;
  let logger;

  beforeEach(() => {
    req = {
      query: {
        page: 3,
        sortBy: 'name',
        sortDirection: 'asc',
        pageSize: 25
      },
      params: {
        sid: '9d672383-cf21-49b4-86d2-7cea955ad422'
      },
      headers: {
        'x-correlation-id': '12312312-cf21-49b4-86d2-12312312312'
      },
      header(header) {
        return this.headers[header];
      }
    };

    logger = require('./../../../src/infrastructure/logger/index');
    logger.error = () => ({ });
    res = httpMocks.createResponse();
    servicesStorage.getById.mockReset();
    servicesStorage.getById.mockReturnValue(
      {
        id: '',
        name: '',
        description: ''
      }
    );

    getOrganisationsAssociatedToService.mockReset().mockReturnValue({
      organisations: searchPage,
      page: req.query.page,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });
  });

  it('then it should send 404 if service id is not a uuid', async() => {
    req.params.sid = 'not-a-uuid';

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 404 if service not found', async() => {
    servicesStorage.getById.mockReset();
    servicesStorage.getById.mockReturnValue(null);

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 200 if service found', async() => {
    servicesStorage.getById.mockReset();
    servicesStorage.getById.mockReturnValue(
      {
        id: '9d672383-cf21-49b4-86d2-7cea955ad422',
        name: 'Service one',
        description: 'Test service'
      }
    );
    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 if page number is not greather than 0 ', async() => {
    req.query.page = 0;

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 if page number is not a number ', async() => {
    req.query.page = 'test';

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 if page size is not greather than 0 ', async() => {
    req.query.pageSize = 0;

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 if page size is not a number ', async() => {
    req.query.pageSize = 'test';

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 if page size is greather than 50 ', async() => {
    req.query.pageSize = 51;

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 200 if page size is not defined  ', async() => {
    req.query.pageSize = undefined;

    await getOrganisationsAssociatedWithService(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
    expect(getOrganisationsAssociatedToService.mock.calls).toHaveLength(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][3]).toBe(25);
  });

  it('then it should return specified page of unfiltered organisations if no search specified', async() => {
    await getOrganisationsAssociatedWithService(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: searchPage,
      page: req.query.page,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });
    expect(getOrganisationsAssociatedToService.mock.calls).toHaveLength(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][0]).toBe('9d672383-cf21-49b4-86d2-7cea955ad422');
    expect(getOrganisationsAssociatedToService.mock.calls[0][1]).toBe(undefined);
    expect(getOrganisationsAssociatedToService.mock.calls[0][2]).toBe(3);
    expect(getOrganisationsAssociatedToService.mock.calls[0][3]).toBe(25);
    expect(getOrganisationsAssociatedToService.mock.calls[0][4]).toBe('name');
    expect(getOrganisationsAssociatedToService.mock.calls[0][5]).toBe('asc');
  });

  it('then it should return first page oforganisations if no search or page specified', async() => {
    req.query.page = undefined;
    getOrganisationsAssociatedToService.mockReset().mockReturnValue({
      organisations: searchPage,
      page: 1,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });

    await getOrganisationsAssociatedWithService(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: searchPage,
      page: 1,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });
    expect(getOrganisationsAssociatedToService.mock.calls).toHaveLength(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][0]).toBe('9d672383-cf21-49b4-86d2-7cea955ad422');
    expect(getOrganisationsAssociatedToService.mock.calls[0][1]).toBe(undefined);
    expect(getOrganisationsAssociatedToService.mock.calls[0][2]).toBe(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][3]).toBe(25);
    expect(getOrganisationsAssociatedToService.mock.calls[0][4]).toBe('name');
    expect(getOrganisationsAssociatedToService.mock.calls[0][5]).toBe('asc');
  });
  it('then it should return specified page of filtered organisations if search specified', async() => {
    req.query.search = 'search';

    await getOrganisationsAssociatedWithService(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: searchPage,
      page: req.query.page,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });
    expect(getOrganisationsAssociatedToService.mock.calls).toHaveLength(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][0]).toBe('9d672383-cf21-49b4-86d2-7cea955ad422');
    expect(getOrganisationsAssociatedToService.mock.calls[0][1]).toBe(req.query.search);
    expect(getOrganisationsAssociatedToService.mock.calls[0][2]).toBe(3);
    expect(getOrganisationsAssociatedToService.mock.calls[0][3]).toBe(25);
  });

  it('then it should return first page of filtered organisations if search but no page specified', async() => {
    req.query.search = 'search';
    req.query.page = undefined;
    getOrganisationsAssociatedToService.mockReset().mockReturnValue({
      organisations: searchPage,
      page: 1,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });

    await getOrganisationsAssociatedWithService(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: searchPage,
      page: 1,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords
    });
    expect(getOrganisationsAssociatedToService.mock.calls).toHaveLength(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][0]).toBe('9d672383-cf21-49b4-86d2-7cea955ad422');
    expect(getOrganisationsAssociatedToService.mock.calls[0][1]).toBe(req.query.search);
    expect(getOrganisationsAssociatedToService.mock.calls[0][2]).toBe(1);
    expect(getOrganisationsAssociatedToService.mock.calls[0][3]).toBe(25);
    expect(getOrganisationsAssociatedToService.mock.calls[0][4]).toBe('name');
    expect(getOrganisationsAssociatedToService.mock.calls[0][5]).toBe('asc');
  });
});
