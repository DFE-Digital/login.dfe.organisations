jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn()
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    pagedListOfAllRequestTypesForOrg: jest.fn()
  };
});

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

const logger = require('./../../../src/infrastructure/logger');
const { pagedListOfAllRequestTypesForOrg } = require('./../../../src/app/organisations/data/organisationsStorage');
const getAllRequestsTypesAssociatedWithOrgs = require('../../../src/app/organisations/getAllRequestsTypesAssociatedWithOrgs');

describe('When getting all pending requests (organisation access, service access, sub-service access) for an organisation', () => {
  let req;
  const expectedRequestCorrelationId = '392f0e46-787b-41bc-9e77-4c3cb94824bb';
  const orgIds = ['1d672383-cf21-49b4-86d2-7cea955ad422', '1d672383-cf21-49b4-86d2-7cea955ad421'];
  const pagedResult = {
    requests: [{
      id: 'requestId1',
      org_id: '1d672383-cf21-49b4-86d2-7cea955ad422',
      org_name: 'Organisation Test One',
      user_id: 'user_id_11',
      created_date: '12/12/2019',
      request_type: { id: 'organisation', name: 'Organisation access' },
      status: {
        id: 0,
        name: 'Pending'
      }
    },
    {
      id: 'requestId2',
      org_id: '1d672383-cf21-49b4-86d2-7cea955ad421',
      org_name: 'Organisation Test Two',
      user_id: 'user_id_11',
      created_date: '12/12/2019',
      request_type: { id: 'service', name: 'Service access' },
      status: {
        id: 0,
        name: 'Pending'
      }
    },
    {
      id: 'requestId3',
      org_id: '1d672383-cf21-49b4-86d2-7cea955ad421',
      org_name: 'Organisation Test Two',
      user_id: 'user_id_11',
      created_date: '12/12/2019',
      request_type: { id: 'sub-service', name: 'Sub-service access' },
      status: {
        id: 0,
        name: 'Pending'
      }
    }],
    pageNumber: 1,
    totalNumberOfPages: 1,
    totalNumberOfRecords: 1
  };

  beforeEach(() => {
    res.mockResetAll();
    req = {
      params: {
        orgIds
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId
      },
      header(header) {
        return this.headers[header];
      }
    };

    pagedListOfAllRequestTypesForOrg.mockReset();

    pagedListOfAllRequestTypesForOrg.mockReturnValue(pagedResult);
  });

  it('then it should check if the query page number is greater than 0', async() => {
    req = {
      query: {
        page: 0
      }
    };
    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(pagedListOfAllRequestTypesForOrg).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Page must be greater than 0');
  });

  it('then it should check if the query page size is grater than 0 ', async() => {
    req = {
      query: {
        pageSize: 0
      }
    };
    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(pagedListOfAllRequestTypesForOrg).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Page size must be greater than 0');
  });

  it('then it should check if the query page size is not grater than 500 ', async() => {
    req = {
      query: {
        pageSize: 501
      }
    };
    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(pagedListOfAllRequestTypesForOrg).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Page size must not be greater than 500');
  });

  it('then it should query for all requests types (organisation, service and sub-service) associated with multiple organisations by orgIds and default page and pageSize', async() => {
    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(pagedListOfAllRequestTypesForOrg).toHaveBeenCalledTimes(1);
    expect(pagedListOfAllRequestTypesForOrg).toHaveBeenCalledWith(orgIds, 1, 25);
  });

  it('then it should send 200 for valid request', async() => {
    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('then it should send all requests requests for org in response if organisations found', async() => {
    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(pagedResult);
  });

  it('then it should log errors and return 500 result', async() => {
    pagedListOfAllRequestTypesForOrg.mockReset().mockImplementation(() => {
      throw new Error('Sequelize error');
    });

    await getAllRequestsTypesAssociatedWithOrgs(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(logger.error.mock.calls).toHaveLength(1);
    expect(logger.error.mock.calls[0][0]).toEqual('Error getting organisation, service and sub-service access requests for organisations 1d672383-cf21-49b4-86d2-7cea955ad422,1d672383-cf21-49b4-86d2-7cea955ad421 - Sequelize error');
  });
});
