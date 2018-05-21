jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    setUserAccessToOrganisation: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { setUserAccessToOrganisation } = require('./../../../src/app/organisations/data/organisationsStorage');
const putUserInOrg = require('./../../../src/app/organisations/putUserInOrg');

describe('when setting a users access within an organisation', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id: 'org1',
        uid: 'user1',
      },
      body: {
        roleId: 10000,
      },
    };

    res = httpMocks.createResponse();

    setUserAccessToOrganisation.mockReset();
  });

  it('then it should set users access in storage', async () => {
    await putUserInOrg(req, res);

    expect(setUserAccessToOrganisation.mock.calls).toHaveLength(1);
    expect(setUserAccessToOrganisation.mock.calls[0][0]).toBe('org1');
    expect(setUserAccessToOrganisation.mock.calls[0][1]).toBe('user1');
    expect(setUserAccessToOrganisation.mock.calls[0][2]).toBe(10000);
  });

  it('then the status of the users access is pending', async () => {
    await putUserInOrg(req, res);

    expect(setUserAccessToOrganisation.mock.calls[0][3]).toBe(0);
  });

  it('then it should return 201 if user was created', async () => {
    setUserAccessToOrganisation.mockReturnValue(true);

    await putUserInOrg(req, res);

    expect(res.statusCode).toBe(201);
  });

  it('then it should return 202 if user was already existed', async () => {
    setUserAccessToOrganisation.mockReturnValue(false);

    await putUserInOrg(req, res);

    expect(res.statusCode).toBe(202);
  });
});
