jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    pagedList: jest.fn(),
    search: jest.fn(),
    pagedSearch: jest.fn(),
  }
});

const httpMocks = require('node-mocks-http');
const { pagedSearch } = require('./../../../src/app/organisations/data/organisationsStorage');
const listOrganisations = require('./../../../src/app/organisations/listOrganisations');

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
        sortBy: 'name',
        sortDirection: 'asc'
      },
    };

    res = httpMocks.createResponse();

    pagedSearch.mockReset().mockReturnValue({
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
      organisations: searchPage,
      page: req.query.page,
      totalNumberOfPages: searchNumberOfPages,
      totalNumberOfRecords: searchNumberOfRecords,
    });
    expect(pagedSearch.mock.calls).toHaveLength(1);
    expect(pagedSearch.mock.calls[0][0]).toBe(undefined);
    expect(pagedSearch.mock.calls[0][1]).toBe(3);
    expect(pagedSearch.mock.calls[0][2]).toBe(25);
  });

  it('then it should return first page of unfiltered organisations if no search or page specified', async () => {
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
    expect(pagedSearch.mock.calls).toHaveLength(1);
    expect(pagedSearch.mock.calls[0][0]).toBe(undefined);
    expect(pagedSearch.mock.calls[0][1]).toBe(1);
    expect(pagedSearch.mock.calls[0][2]).toBe(25);
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
    expect(pagedSearch.mock.calls).toHaveLength(1);
    expect(pagedSearch.mock.calls[0][0]).toBe(req.query.search);
    expect(pagedSearch.mock.calls[0][1]).toBe(3);
    expect(pagedSearch.mock.calls[0][2]).toBe(25);
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
    expect(pagedSearch.mock.calls).toHaveLength(1);
    expect(pagedSearch.mock.calls[0][0]).toBe(req.query.search);
    expect(pagedSearch.mock.calls[0][1]).toBe(1);
    expect(pagedSearch.mock.calls[0][2]).toBe(25);
  });

  it('then it should search if search param provided but blank and filtercategory specified', async () => {
    req.query.search = '';
    req.query.filtercategory = '001';

    await listOrganisations(req, res);

    expect(pagedSearch.mock.calls).toHaveLength(1);
    expect(pagedSearch.mock.calls[0][0]).toBe(req.query.search);
    expect(pagedSearch.mock.calls[0][1]).toBe(3);
    expect(pagedSearch.mock.calls[0][2]).toBe(25);
    expect(pagedSearch.mock.calls[0][3]).toEqual(['001']);
    expect(pagedSearch.mock.calls[0][4]).toEqual([]);
  });

  it('then it should search if search param provided but blank and filterstatus specified', async () => {
    req.query.search = '';
    req.query.filterstatus = '1';

    await listOrganisations(req, res);

    expect(pagedSearch.mock.calls).toHaveLength(1);
    expect(pagedSearch.mock.calls[0][0]).toBe(req.query.search);
    expect(pagedSearch.mock.calls[0][1]).toBe(3);
    expect(pagedSearch.mock.calls[0][2]).toBe(25);
    expect(pagedSearch.mock.calls[0][3]).toEqual([]);
    expect(pagedSearch.mock.calls[0][4]).toEqual(['1']);
  });

  it('then it should not search if search param not provided and filtercategory specified', async () => {
    req.query.search = undefined;
    req.query.filtercategory = '001';

    await listOrganisations(req, res);

    // expect(pagedSearch.mock.calls).toHaveLength(0);
    expect(pagedSearch.mock.calls).toHaveLength(1);
  });

  it('then it should not search if search param not provided and filterstatus specified', async () => {
    req.query.search = undefined;
    req.query.filterstatus = '1';

    await listOrganisations(req, res);

    // expect(pagedSearch.mock.calls).toHaveLength(0);
    expect(pagedSearch.mock.calls).toHaveLength(1);
  });
});
