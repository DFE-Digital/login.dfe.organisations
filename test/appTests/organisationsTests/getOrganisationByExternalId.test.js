jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getOrgByUrn: jest.fn(),
    getOrgByUid: jest.fn(),
    getOrgByEstablishmentNumber: jest.fn(),
    getOrgByLegacyId: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { getOrgByUrn, getOrgByUid, getOrgByEstablishmentNumber, getOrgByLegacyId } = require('./../../../src/app/organisations/data/organisationsStorage');
const get = require('./../../../src/app/organisations/getOrganisationByExternalId');
const org = {
  id: '8B2A7DBA-BFD9-440F-9A14-03E94DDA4ED6',
  name: '? N?S ENTERTAINMENT LIMITED',
  Category: '010',
  Type: null,
  URN: null,
  UID: '16840',
  upin: null,
  UKPRN: null,
  EstablishmentNumber: null,
  Status: 1,
  ClosedOn: null,
  Address: 'Not recorded',
};

describe('when getting an organisation by id', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id: 'org-1',
        type: '010',
      },
    };

    res = httpMocks.createResponse();

    getOrgByUrn.mockReset();
    getOrgByUid.mockReset();
    getOrgByEstablishmentNumber.mockReset();
    getOrgByLegacyId.mockReset();
  });

  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });

  it('then a bad request is returned if the id is not passed', async () => {
    req.params.id = '';

    await get(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('then a bad request is returned if the type is not passed', async () => {
    req.params.type = '';

    await get(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('it should return json for organisation if found by Uid if of type 010', async () => {
    getOrgByUid.mockReturnValue(org);

    await get(req, res);

    expect(getOrgByUid.mock.calls).toHaveLength(1);
    expect(getOrgByUrn.mock.calls).toHaveLength(0);
    expect(getOrgByEstablishmentNumber.mock.calls).toHaveLength(0);
    expect(getOrgByLegacyId.mock.calls).toHaveLength(0);
    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(org);
  });

  it('it should return json for organisation if found by Uid if of type 013', async () => {
    req.params.type = '013';

    getOrgByUid.mockReturnValue(org);

    await get(req, res);

    expect(getOrgByUid.mock.calls).toHaveLength(1);
    expect(getOrgByUrn.mock.calls).toHaveLength(0);
    expect(getOrgByEstablishmentNumber.mock.calls).toHaveLength(0);
    expect(getOrgByLegacyId.mock.calls).toHaveLength(0);
    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(org);
  });

  it('it should return json for organisation if found by urn if of type 001', async () => {
    req.params.type = '001';

    getOrgByUrn.mockReturnValue(org);

    await get(req, res);

    expect(getOrgByUid.mock.calls).toHaveLength(0);
    expect(getOrgByUrn.mock.calls).toHaveLength(1);
    expect(getOrgByEstablishmentNumber.mock.calls).toHaveLength(0);
    expect(getOrgByLegacyId.mock.calls).toHaveLength(0);
    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(org);
  });

  it('it should return json for organisation if found by establishment number if of type 002', async () => {
    req.params.type = '002';

    getOrgByEstablishmentNumber.mockReturnValue(org);

    await get(req, res);

    expect(getOrgByUid.mock.calls).toHaveLength(0);
    expect(getOrgByUrn.mock.calls).toHaveLength(0);
    expect(getOrgByEstablishmentNumber.mock.calls).toHaveLength(1);
    expect(getOrgByLegacyId.mock.calls).toHaveLength(0);
    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(org);
  });

  it('it should return json for organisation if found by legacy id if of type 000', async () => {
    req.params.type = '000';

    getOrgByLegacyId.mockReturnValue(org);

    await get(req, res);

    expect(getOrgByUid.mock.calls).toHaveLength(0);
    expect(getOrgByUrn.mock.calls).toHaveLength(0);
    expect(getOrgByEstablishmentNumber.mock.calls).toHaveLength(0);
    expect(getOrgByLegacyId.mock.calls).toHaveLength(1);
    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(org);
  });
});
