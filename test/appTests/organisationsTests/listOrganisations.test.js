jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    pagedList: jest.fn(),
    search: jest.fn(),
  }
});

const httpMocks = require('node-mocks-http');
const { pagedList, search } = require('./../../../src/app/organisations/data/organisationsStorage');
const listOrganisations = require('./../../../src/app/organisations/listOrganisations');

const allPage = [
  { id: 'orgA' },
];
const allNumberOfPages = 10;
const allNumberOfRecords = 249;

const searchPage = [
  { id: 'org1' },
];
const searchNumberOfPages = 3;
const searchNumberOfRecords = 74;

describe('when listing or searching', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {
        page: 3,
      },
    };

    res = httpMocks.createResponse();

    pagedList.mockReset().mockReturnValue({
      organisations: allPage,
      totalNumberOfPages: allNumberOfPages,
      totalNumberOfRecords: allNumberOfRecords,
    });

    search.mockReset().mockReturnValue({
      organisations: searchPage,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords,
    });
  });

  it('then it should return specified page of unfiltered organisations if no search specified', async () => {
    await listOrganisations(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: allPage,
      page: req.query.page,
      totalNumberOfPages: allNumberOfPages,
      totalNumberOfRecords: allNumberOfRecords,
    });
    expect(pagedList.mock.calls).toHaveLength(1);
    expect(pagedList.mock.calls[0][0]).toBe(3);
    expect(pagedList.mock.calls[0][1]).toBe(25);
  });

  it('then it should return first page of unfiltered organisations if no search or page specified', async () => {
    req.query.page = undefined;

    await listOrganisations(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: allPage,
      page: 1,
      totalNumberOfPages: allNumberOfPages,
      totalNumberOfRecords: allNumberOfRecords,
    });
    expect(pagedList.mock.calls).toHaveLength(1);
    expect(pagedList.mock.calls[0][0]).toBe(1);
    expect(pagedList.mock.calls[0][1]).toBe(25);
  });

  it('then it should return specified page of filtered organisations if search specified', async () => {
    req.query.search = 'search';

    await listOrganisations(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: searchPage,
      page: req.query.page,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords,
    });
    expect(search.mock.calls).toHaveLength(1);
    expect(search.mock.calls[0][0]).toBe(req.query.search);
    expect(search.mock.calls[0][1]).toBe(3);
    expect(search.mock.calls[0][2]).toBe(25);
  });

  it('then it should return first page of filtered organisations if search but no page specified', async () => {
    req.query.search = 'search';
    req.query.page = undefined;

    await listOrganisations(req, res);

    expect(res._isJSON());
    expect(res._isEndCalled());
    expect(res._getData()).toEqual({
      organisations: searchPage,
      page: 1,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords,
    });
    expect(search.mock.calls).toHaveLength(1);
    expect(search.mock.calls[0][0]).toBe(req.query.search);
    expect(search.mock.calls[0][1]).toBe(1);
    expect(search.mock.calls[0][2]).toBe(25);
  });
});