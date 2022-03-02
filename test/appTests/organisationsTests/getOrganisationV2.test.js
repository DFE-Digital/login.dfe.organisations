jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getOrgById: jest.fn(),
  }
});

const httpMocks = require('node-mocks-http');
const { getOrgById } = require('./../../../src/app/organisations/data/organisationsStorage');
const getOrganisation = require('./../../../src/app/organisations/getOrganisationV2');

describe('when getting an organisation by id', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id: 'org-1',
      },
    };

    res = httpMocks.createResponse();

    getOrgById.mockReset();
  });

  it('it should return 404 if organisation not found', async () => {
    await getOrganisation(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('it should return json for organisation if found', async () => {
    const org = {
      id: '20D72532-3C2C-4EEA-B2BF-A0177B26FE59',
      name: '21st Century Academy',
      category: {
        id: '001',
        name: 'Establishment'
      },
      type: {
        id: '10',
        name: 'Other Independent Special School'
      },
      urn: '134418',
      uid: null,
      ukprn: null,
      establishmentNumber: '6063',
      status: {
        id: 2,
        name: 'Closed'
      },
      closedOn: '2004-06-14T00:00:00.000Z',
      address: '',
      telephone: '02085393337',
      region: {
        id: 'H',
        name: 'London'
      },
      localAuthority: {
        id: '65A2E217-2BB7-4ACF-A7B0-C919AD258572',
        name: 'Waltham Forest',
        code: '320'
      },
      phaseOfEducation: {
        id: 0,
        name: 'Not applicable'
      },
      statutoryLowAge: 14,
      statutoryHighAge: 16,
      legacyId: null,
      companyRegistrationNumber: null,
      DistrictAdministrative_code: null
    };
    getOrgById.mockReturnValue(org);

    await getOrganisation(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual(org);
    expect(res._isEndCalled()).toBe(true);
  });
});
