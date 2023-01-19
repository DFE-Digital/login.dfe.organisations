jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => ({
  getPagedListOfUsersV3: jest.fn()
}));

const { getPagedListOfUsersV3 } = require('./../../../src/app/organisations/data/organisationsStorage');
const listUserOrganisationsV3 = require('./../../../src/app/organisations/listUserOrganisationsV3');

const res = {
  json: jest.fn(),
  status: jest.fn(),
  send: jest.fn(),
  mockResetAll: function() {
    this.json.mockReset().mockReturnValue(this);
    this.status.mockReset().mockReturnValue(this);
    this.send.mockReset().mockReturnValue(this);
  }
};

describe('when listing user organisations', () => {
  let req;
  let pageOfUsers;

  beforeEach(() => {
    req = {
      body: {}
    };

    res.mockResetAll();

    pageOfUsers = {
      users: [
        {
          userId: 'userId',
          organisation: {
            id: 'orgId',
            name: 'organisation name',
            category: {
              id: '051',
              name: 'Further Education'
            },
            urn: null,
            uid: null,
            ukprn: '12345',
            status: {
              id: 1,
              name: 'Open'
            },
            address: null,
            legacyId: '1234',
            companyRegistrationNumber: null,
            DistrictAdministrativeCode: null,
            DistrictAdministrative_code: null
          },
          role: {
            id: 0,
            name: 'End user'
          },
          status: 1,
          numericIdentifier: '84',
          textIdentifier: '77fffdd'
        }
      ],
      page: 1,
      numberOfPages: 2,
      totalNumberOfRecords: 20
    };
    getPagedListOfUsersV3.mockReset().mockReturnValue(pageOfUsers);
  });

  it('then it should return page of users as json', async() => {
    await listUserOrganisationsV3(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(pageOfUsers);
  });

  it('then it should get page of user organisations from repository using defaults if no options provided', async() => {
    await listUserOrganisationsV3(req, res);

    expect(getPagedListOfUsersV3).toHaveBeenCalledTimes(1);
    expect(getPagedListOfUsersV3).toHaveBeenCalledWith(1, 100, undefined, []);
  });

  it('then it should get page of user organisations from repository using provided options', async() => {
    const mockPolicies = [{
      id: 'policy1',
      name: 'policy name',
      conditions: [{
        field: 'organisation.status.id',
        value: [
          '4',
          '3',
          '1'
        ]
      }]
    }];

    req.body = {
      page: 2,
      pageSize: 10,
      role: 10000,
      policies: mockPolicies
    };

    await listUserOrganisationsV3(req, res);

    expect(getPagedListOfUsersV3).toHaveBeenCalledTimes(1);
    expect(getPagedListOfUsersV3).toHaveBeenCalledWith(2, 10, 10000, mockPolicies);
  });
});
