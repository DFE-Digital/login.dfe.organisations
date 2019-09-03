jest.mock('./../../../src/infrastructure/config', () => {
  const singleton = {};
  return () => (singleton);
});
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    createUserOrgRequest: jest.fn(),
  };
});

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

const { createUserOrgRequest } = require('./../../../src/app/organisations/data/organisationsStorage');
const createUserOrganisationRequest = require('./../../../src/app/organisations/createUserOrganisationRequest');

describe('when creating a user organisation request ', () => {
  let req;

  beforeEach(() => {
    req = {
      params: {
        id: 'org1',
        uid: 'user1',
      },
      body: {
        reason: 'Test',
      },
    };
    res.mockResetAll();
    createUserOrgRequest.mockReset().mockReturnValue('some-new-id');
  });
  it('then it should create user org request in storage', async () => {
    await createUserOrganisationRequest(req, res);

    expect(createUserOrgRequest.mock.calls).toHaveLength(1);
    expect(createUserOrgRequest.mock.calls[0][0]).toEqual({
      organisationId: 'org1',
      reason: 'Test',
      userId: 'user1',
    });
  });

  it('then the requestId is returned in the response', async () => {
    await createUserOrganisationRequest(req, res);

    expect(res.send).toHaveBeenCalledWith('some-new-id');
  });

  it('then it should return 201 if user request was created', async () => {
    await createUserOrganisationRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
