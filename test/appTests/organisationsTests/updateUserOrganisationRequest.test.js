jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => ({
  getUserOrgRequestById: jest.fn(),
  updateUserOrgRequest: jest.fn(),
}));

jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
}));

const { getUserOrgRequestById, updateUserOrgRequest } = require('./../../../src/app/organisations/data/organisationsStorage');
const updateUserOrganisationRequest = require('./../../../src/app/organisations/updateUserOrganisationRequest');

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

describe('when patching an organisation request', () => {
  let req;

  beforeEach(() => {
    req = {
      header: () => 'correlation-id',
      params: {
        rid: 'requestId',
      },
      body: {
        status: 1,
        actioned_by: 'userId',
        actioned_reason: 'reason for action',
        actioned_at: '01/02/2019',
      },
    };
    getUserOrgRequestById.mockReset().mockReturnValue({
      id: 'requestId',
      user_id: 'userId',
      organisation_id: 'org1',
      reason: 'reason for request',
    });
    updateUserOrgRequest.mockReset();

    res.mockResetAll();
  });

  it('then it should get the request from storage', async () => {
    await updateUserOrganisationRequest(req, res);

    expect(getUserOrgRequestById.mock.calls).toHaveLength(1);
    expect(getUserOrgRequestById.mock.calls[0][0]).toBe('requestId');
  });

  it('then it should send 404 if user not found', async () => {
    getUserOrgRequestById.mockReturnValue(null);

    await updateUserOrganisationRequest(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should send 400 response if no properties in body', async () => {
    req.body = {};

    await updateUserOrganisationRequest(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual('Must specify at least one property. Patchable properties status,actioned_by,actioned_reason,actioned_at');
  });

  it('then it should send 400 response if unpatchable property', async () => {
    req.body.invalidProperty = 'invalid';

    await updateUserOrganisationRequest(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual('Unpatchable property invalidProperty. Allowed properties status,actioned_by,actioned_reason,actioned_at');
  });

  it('then it should update user in storage with new details', async () => {
    await updateUserOrganisationRequest(req, res);

    expect(updateUserOrgRequest.mock.calls).toHaveLength(1);
    expect(updateUserOrgRequest.mock.calls[0][0]).toBe('requestId');
    expect(updateUserOrgRequest.mock.calls[0][1]).toBe(req.body);
  });

  it('then it should send 202 response', async () => {

    await updateUserOrganisationRequest(req, res);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
