jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
jest.mock('./../../../src/app/services/data/servicesStorage', () => {
  const upsert = jest.fn();
  return {
    upsertServiceUser: jest.fn().mockImplementation(upsert),
  };
});

jest.mock('./../../../src/app/services/data/organisationsStorage', () => {
  const getByUid = jest.fn();
  const getByUrn = jest.fn();
  return {
    getOrgByUrn: getByUrn,
    getOrgByUid: getByUid,
  };
});

const servicesStorage = require('./../../../src/app/services/data/servicesStorage');
const organisationStorage = require('./../../../src/app/services/data/organisationsStorage');
const httpMocks = require('node-mocks-http');
const postUpsertServiceUser = require('../../../src/app/services/postServiceUser');

describe('when posting to link a user to a service', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = '60fa3608-f1a0-41d9-a0b5-32a2e04b6c59';

  beforeEach(() => {
    req = {
      params: {
        ext_org_id: 'ext_org_1',
        sid: 'svc1',
        uid: 'user1',
      },
      body: {
        org_type: '001',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    servicesStorage.upsertServiceUser.mockReset();
    organisationStorage.getOrgByUrn.mockReset().mockReturnValue({ id: 'org1' });
    organisationStorage.getOrgByUid.mockReset().mockReturnValue({ id: 'org2' });
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });

  it('then if the params are missing a bad request is retuned', async () => {
    req.params.ext_org_id = '';
    req.params.sid = '';
    req.params.uid = '';

    await postUpsertServiceUser(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('then the organisation is looked up by URN when the type is 001', async () => {
    req.body.org_type = '001';

    await postUpsertServiceUser(req, res);

    expect(organisationStorage.getOrgByUrn.mock.calls).toHaveLength(1);
  });

  it('then the organisation is looked up by UID when the type is 010', async () => {
    req.body.org_type = '010';

    await postUpsertServiceUser(req, res);

    expect(organisationStorage.getOrgByUid.mock.calls).toHaveLength(1);
  });

  it('then the organisation is looked up by UID when the type is 013', async () => {
    req.body.org_type = '013';

    await postUpsertServiceUser(req, res);

    expect(organisationStorage.getOrgByUid.mock.calls).toHaveLength(1);
  });

  it('then if no organisation is found a bad request is returned', async () => {
    organisationStorage.getOrgByUrn.mockReset().mockReturnValue(null);

    await postUpsertServiceUser(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('then if the request is valid it is passed to the create command', async () => {
    req.body.status = 10;
    req.body.roleId = 100;

    await postUpsertServiceUser(req, res);

    expect(servicesStorage.upsertServiceUser.mock.calls).toHaveLength(1);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].userId).toBe(req.params.uid);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].organisationId).toBe('org1');
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].serviceId).toBe(req.params.sid);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].roleId).toBe(100);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].status).toBe(10);
  });

  it('then if the request is valid and the status and role id arent passed the default values are used', async () => {
    await postUpsertServiceUser(req, res);

    expect(servicesStorage.upsertServiceUser.mock.calls).toHaveLength(1);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].userId).toBe(req.params.uid);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].organisationId).toBe('org1');
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].serviceId).toBe(req.params.sid);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].roleId).toBe(0);
    expect(servicesStorage.upsertServiceUser.mock.calls[0][0].status).toBe(1);
  });
});
