const httpMocks = require('node-mocks-http');
const { deleteUserOrganisation, getServiceAndSubServiceReqForOrgs, updateUserServSubServRequest } = require('./../../../src/app/organisations/data/organisationsStorage');
const deleteUserOrg = require('./../../../src/app/organisations/deleteUserOrganisation');

jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => ({
  deleteUserOrganisation: jest.fn(),
  updateUserServSubServRequest: jest.fn(),
  getServiceAndSubServiceReqForOrgs: jest.fn().mockResolvedValue([
    {
      id: "request-id-1",
      org_id: 'org1',
      org_name: 'org1',
      user_id: 'user1',
      created_date: '',
      request_type: '',
      status: '-1'
    }
  ]),
}));

describe('when deleting a users access to an organisation', () => {
  let req;
  let res;

  beforeEach(() => {
    req = httpMocks.createRequest({
      method: 'DELETE',
      url: '/organisations/:id/users/:uid',
      params: {
        id: 'org1',
        uid: 'user1',
      },
    });
    req.get = jest.fn().mockReturnValue('correlation-id');
    res = httpMocks.createResponse();

    jest.clearAllMocks();
  });

  it('should delete user access in storage', async () => {
    await deleteUserOrg(req, res);

    expect(deleteUserOrganisation).toHaveBeenCalledTimes(1);
    expect(deleteUserOrganisation).toHaveBeenCalledWith('org1', 'user1', 'correlation-id');
  });

  it('should return 204 if the organisation was deleted', async () => {
    deleteUserOrganisation.mockResolvedValue(true);

    await deleteUserOrg(req, res);

    expect(res.statusCode).toBe(204);
    expect(res._getData()).toBe('');
  });

  it('should update user service requests after deletion', async () => {
    getServiceAndSubServiceReqForOrgs.mockResolvedValue([
      { id: 'request-id-1', user_id: 'user1', status: 0 },
      { id: 'request-id-2', user_id: 'other-user-id', status: 0 },
    ]);
    updateUserServSubServRequest.mockResolvedValue();
    deleteUserOrganisation.mockResolvedValue(true);

    await deleteUserOrg(req, res);

    expect(getServiceAndSubServiceReqForOrgs).toHaveBeenCalledWith(['org1']);
    expect(updateUserServSubServRequest).toHaveBeenCalledWith('request-id-1', {
      id: "request-id-1",
      user_id: "user1",
      status: -1,
      reason: 'User has left organisation.',
      actioned_reason: 'Rejected',
    });
    expect(updateUserServSubServRequest).toHaveBeenCalledTimes(1);
    expect(deleteUserOrganisation).toHaveBeenCalledTimes(1);
    expect(deleteUserOrganisation).toHaveBeenCalledWith('org1', 'user1', 'correlation-id');
    expect(res.statusCode).toBe(204);
    expect(res._getData()).toBe('');
  });

  it('should handle case where no user requests exist', async () => {
    getServiceAndSubServiceReqForOrgs.mockResolvedValue([]);
    deleteUserOrganisation.mockResolvedValue(true);

    await deleteUserOrg(req, res);

    expect(getServiceAndSubServiceReqForOrgs).toHaveBeenCalledWith(['org1']);
    expect(updateUserServSubServRequest).not.toHaveBeenCalled();
    expect(deleteUserOrganisation).toHaveBeenCalledWith('org1', 'user1', 'correlation-id');
    expect(res.statusCode).toBe(204);
    expect(res._getData()).toBe('');
  });

  it('should handle errors and respond with 500 status code', async () => {
    const error = new Error('Database error');
    getServiceAndSubServiceReqForOrgs.mockRejectedValue(error);

    await deleteUserOrg(req, res);

    expect(getServiceAndSubServiceReqForOrgs).toHaveBeenCalledWith(['org1']);
    expect(res.statusCode).toBe(500);
    expect(res._getData()).toEqual('{"error":"Internal Server Error"}');
  });
});