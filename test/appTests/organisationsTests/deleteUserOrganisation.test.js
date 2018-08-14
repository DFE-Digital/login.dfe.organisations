jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    deleteUserOrganisation: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { deleteUserOrganisation } = require('./../../../src/app/organisations/data/organisationsStorage');
const deleteUserOrg = require('./../../../src/app/organisations/deleteUserOrganisation');

describe('when deleting a users access from an organisation', () => {
  let req;
  let res;
  beforeEach(() => {
    req = {
      params: {
        id: 'org1',
        uid: 'user1',
      },
    };
    req.get = jest.fn().mockReturnValue('correlation-id');
    res = httpMocks.createResponse();
    deleteUserOrganisation.mockReset();
  });

  it('then it should delete users access in storage', async () => {
    await deleteUserOrg(req, res);
    expect(deleteUserOrganisation.mock.calls).toHaveLength(1);
    expect(deleteUserOrganisation.mock.calls[0][0]).toBe('org1');
    expect(deleteUserOrganisation.mock.calls[0][1]).toBe('user1');
    expect(deleteUserOrganisation.mock.calls[0][2]).toBe('correlation-id');
  });

  it('then it should return 204 if org was deleted', async () => {
    deleteUserOrganisation.mockReturnValue(true);
    await deleteUserOrg(req, res);
    expect(res.statusCode).toBe(204);
  });
});
