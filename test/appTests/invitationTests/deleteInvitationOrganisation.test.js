jest.mock('./../../../src/app/invitations/data/invitationsStorage', () => {
  return {
    deleteInvitationOrganisation: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { deleteInvitationOrganisation } = require('./../../../src/app/invitations/data/invitationsStorage');
const deleteInvitationOrg = require('./../../../src/app/invitations/deleteInvitationOrganisation');

describe('when deleting a invitations access from an organisation', () => {
  let req;
  let res;
  beforeEach(() => {
    req = {
      params: {
        org_id: 'org1',
        inv_id: 'inv-user1',
      },
    };
    req.get = jest.fn().mockReturnValue('correlation-id');
    res = httpMocks.createResponse();
    deleteInvitationOrganisation.mockReset();
  });

  it('then it should delete invitations access in storage', async () => {
    await deleteInvitationOrg(req, res);
    expect(deleteInvitationOrganisation.mock.calls).toHaveLength(1);
    expect(deleteInvitationOrganisation.mock.calls[0][0]).toBe('org1');
    expect(deleteInvitationOrganisation.mock.calls[0][1]).toBe('inv-user1');
    expect(deleteInvitationOrganisation.mock.calls[0][2]).toBe('correlation-id');
  });

  it('then it should return 204 if invitation org was deleted', async () => {
    deleteInvitationOrganisation.mockReturnValue(true);
    await deleteInvitationOrg(req, res);
    expect(res.statusCode).toBe(204);
  });
});
