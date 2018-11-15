jest.mock('./../../../src/infrastructure/config', () => {
  const singleton = {};
  return () => (singleton);
});
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    setUserAccessToOrganisation: jest.fn(),
    getUserOrganisationByTextIdentifier: jest.fn(),
    getNextUserOrgNumericIdentifier: jest.fn(),
  };
});
jest.mock('./../../../src/utils', () => ({
  encodeNumberToString: jest.fn(),
}));

const httpMocks = require('node-mocks-http');
const config = require('./../../../src/infrastructure/config')();
const { setUserAccessToOrganisation, getUserOrganisationByTextIdentifier, getNextUserOrgNumericIdentifier } = require('./../../../src/app/organisations/data/organisationsStorage');
const { encodeNumberToString } = require('./../../../src/utils');
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
        reason: 'Test',
        numericIdentifier: 123456,
        textIdentifier: 'userone',
      },
    };

    res = httpMocks.createResponse();

    config.toggles = undefined;

    setUserAccessToOrganisation.mockReset();
    getUserOrganisationByTextIdentifier.mockReset();
    getNextUserOrgNumericIdentifier.mockReset().mockReturnValue(789456);

    encodeNumberToString.mockReset().mockReturnValue({
      option1: 'opt1',
      option2: 'opt2',
      option3: 'opt3',
      option4: 'opt4',
      option5: 'opt5',
    });
  });

  it('then it should set users access in storage', async () => {
    await putUserInOrg(req, res);

    expect(setUserAccessToOrganisation.mock.calls).toHaveLength(1);
    expect(setUserAccessToOrganisation.mock.calls[0][0]).toBe('org1');
    expect(setUserAccessToOrganisation.mock.calls[0][1]).toBe('user1');
    expect(setUserAccessToOrganisation.mock.calls[0][2]).toBe(10000);
    expect(setUserAccessToOrganisation.mock.calls[0][3]).toBe(0);
    expect(setUserAccessToOrganisation.mock.calls[0][4]).toBe('Test');
    expect(setUserAccessToOrganisation.mock.calls[0][5]).toBe(123456);
    expect(setUserAccessToOrganisation.mock.calls[0][6]).toBe('userone');
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

  it('then it should get next user identifier when numericIdentifier not set and generateUserOrgIdentifiers is true', async () => {
    config.toggles = {
      generateUserOrgIdentifiers: true,
    };
    req.body.numericIdentifier = undefined;

    await putUserInOrg(req, res);

    expect(getNextUserOrgNumericIdentifier).toHaveBeenCalledTimes(1);
    expect(setUserAccessToOrganisation.mock.calls[0][5]).toBe(789456);
  });

  it('then it should store undefined when numericIdentifier not set and generateUserOrgIdentifiers is false', async () => {
    req.body.numericIdentifier = undefined;

    await putUserInOrg(req, res);

    expect(setUserAccessToOrganisation.mock.calls[0][5]).toBe(undefined);
  });

  it('then it should use encoded numericIdentifier for textIdentifier when textIdentifier not set and generateUserOrgIdentifiers is true', async () => {
    config.toggles = {
      generateUserOrgIdentifiers: true,
    };
    req.body.textIdentifier = undefined;

    await putUserInOrg(req, res);

    expect(getUserOrganisationByTextIdentifier).toHaveBeenCalledTimes(1);
    expect(setUserAccessToOrganisation.mock.calls[0][6]).toBe('opt1');
  });

  it('then it should use other encoded numericIdentifier options for textIdentifier when textIdentifier not set and generateUserOrgIdentifiers is true and earlier options already in use by another user', async () => {
    config.toggles = {
      generateUserOrgIdentifiers: true,
    };
    req.body.textIdentifier = undefined;
    getUserOrganisationByTextIdentifier.mockReturnValueOnce({ user_id: 'user2', organisation_id: 'org1' })
      .mockReturnValueOnce({ user_id: 'user3', organisation_id: 'org1' }).mockReturnValueOnce(undefined);

    await putUserInOrg(req, res);

    expect(getUserOrganisationByTextIdentifier).toHaveBeenCalledTimes(3);
    expect(setUserAccessToOrganisation.mock.calls[0][6]).toBe('opt3');
  });

  it('then it should return 500 when textIdentifier not set and generateUserOrgIdentifiers is true and not text identifier options are available', async () => {
    config.toggles = {
      generateUserOrgIdentifiers: true,
    };
    req.body.textIdentifier = undefined;
    getUserOrganisationByTextIdentifier.mockReturnValue({ user_id: 'user2', organisation_id: 'org1' });

    await putUserInOrg(req, res);

    expect(getUserOrganisationByTextIdentifier).toHaveBeenCalledTimes(5);
    expect(res.statusCode).toBe(500);
  });

  it('then it should use encoded numericIdentifier for textIdentifier when textIdentifier not set and generateUserOrgIdentifiers is true and option in use, but by same user and org', async () => {
    config.toggles = {
      generateUserOrgIdentifiers: true,
    };
    req.body.textIdentifier = undefined;
    getUserOrganisationByTextIdentifier.mockReturnValue({ user_id: 'user1', organisation_id: 'org1' });

    await putUserInOrg(req, res);

    expect(getUserOrganisationByTextIdentifier).toHaveBeenCalledTimes(1);
    expect(setUserAccessToOrganisation.mock.calls[0][6]).toBe('opt1');
  });

  it('then it should store undefined when textIdentifier not set and generateUserOrgIdentifiers is false', async () => {
    req.body.textIdentifier = undefined;

    await putUserInOrg(req, res);

    expect(setUserAccessToOrganisation.mock.calls[0][6]).toBe(undefined);
  });
});
