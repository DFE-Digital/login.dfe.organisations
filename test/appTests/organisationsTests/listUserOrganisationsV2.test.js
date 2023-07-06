jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => ({
  getPagedListOfUsersV2: jest.fn(),
}));

const { getPagedListOfUsersV2 } = require('./../../../src/app/organisations/data/organisationsStorage');
const listUserOrganisationsV2 = require('./../../../src/app/organisations/listUserOrganisationsV2');

const res = {
  json: jest.fn(),
  status: jest.fn(),
  send: jest.fn(),
  mockResetAll: function () {
    this.json.mockReset().mockReturnValue(this);
    this.status.mockReset().mockReturnValue(this);
    this.send.mockReset().mockReturnValue(this);
  },
};

describe('when listing user organisations', () => {
  let req;
  let pageOfUsers;

  beforeEach(() => {
    req = {
      query: {},
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
              name: 'Further Education',
            },
            urn: null,
            uid: null,
            upin: '123456',
            ukprn: '12345',
            status: {
              id: 1,
              name: 'Open',
            },
            address: null,
            legacyId: '1234',
            companyRegistrationNumber: null,
            DistrictAdministrativeCode: null,
            DistrictAdministrative_code: null,
          },
          role: {
            id: 0,
            name: 'End user',
          },
          status: 1,
          numericIdentifier: '84',
          textIdentifier: '77fffdd',
        },
      ],
      page: 1,
      numberOfPages: 2,
      totalNumberOfRecords: 20,
    };
    getPagedListOfUsersV2.mockReset().mockReturnValue(pageOfUsers);
  });

  it('then it should return page of users as json', async () => {
    await listUserOrganisationsV2(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(pageOfUsers);
  });

  it('then it should get page of user organisations from repository using defaults if no options provided', async () => {
    await listUserOrganisationsV2(req, res);

    expect(getPagedListOfUsersV2).toHaveBeenCalledTimes(1);
    expect(getPagedListOfUsersV2).toHaveBeenCalledWith(1, 100, undefined, [], []);
  });

  it('then it should get page of user organisations from repository using provided options', async () => {
    req.query = {
      page: 2,
      pageSize: 10,
      role: 10000,
      filtertype: '01',
      filterstatus: '1'
    };

    await listUserOrganisationsV2(req, res);

    expect(getPagedListOfUsersV2).toHaveBeenCalledTimes(1);
    expect(getPagedListOfUsersV2).toHaveBeenCalledWith(2, 10, 10000, ['01'], ['1']);
  });
});
