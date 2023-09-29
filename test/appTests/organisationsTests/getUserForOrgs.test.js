jest.mock('./../../../src/infrastructure/logger', () => ({
  error: jest.fn()
}));
jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => {
  return {
    getUsersdetsAssociatedWithOrganisation: jest.fn()
  };
});

const httpMocks = require('node-mocks-http');
const logger = require('./../../../src/infrastructure/logger');
const { getUsersdetsAssociatedWithOrganisation } = require('./../../../src/app/organisations/data/organisationsStorage');
const getUsersForOrg = require('./../../../src/app/organisations/getUserDetsForOrgs');

describe('when getting users of organisations', () => {
  let req;
  const res = httpMocks.createResponse();
  const expectedRequestCorrelationId = '392f0e46-787b-41bc-9e77-4c3cb94824bb';

  beforeEach(() => {
    req = {
      params: {
        org_id: '1d672383-cf21-49b4-86d2-7cea955ad422'
      },
      query: {
        pageNumber: 1,
        sortColum: 'email',
        order: 'asc',
        pageSize: 4
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId
      },
      header(header) {
        return this.headers[header];
      }
    };

    getUsersdetsAssociatedWithOrganisation.mockReset();

    getUsersdetsAssociatedWithOrganisation.mockReturnValue(
      {
        pagedresults: [
          {
            id: 'A3BAB973-1FB2-4266-8106-B810064FD631',
            status: 1,
            name: 'Rhys Bridges',
            email: 'bridgesrhys+asdfgg@gmail.com',
            lastLogin: null,
            role: 'End user',
            numericIdentifier: '63',
            textIdentifier: 'kkefenn'
          },
          {
            id: 'F8708785-A2AC-466A-9C4F-690CBDA6CE5D',
            status: 1,
            name: 'Rhys Bridges',
            email: 'bridgesrhys+asfdgfgnh@gmail.com',
            lastLogin: null,
            role: 'Approver',
            numericIdentifier: '62',
            textIdentifier: 'k9nen44'
          },
          {
            id: 'B53FF2A6-3EC6-4959-B28C-79E0B1281033',
            status: 1,
            name: 'Rhys Bridges',
            email: 'bridgesrhys+sdfghjkl@gmail.com',
            lastLogin: null,
            role: 'End user',
            numericIdentifier: '48',
            textIdentifier: '984f44d'
          },
          {
            id: '87F1979E-2C8B-442D-BBFF-F988E5638146',
            status: 0,
            name: 'Rhys Bridges',
            email: 'bridgesrhys+swresfdgrhnvhgre@gmail.com',
            lastLogin: '2019-09-03T15:16:54.927Z',
            role: 'End user',
            numericIdentifier: '67',
            textIdentifier: 'kyefndd'
          }
        ],
        totalNumberOfPages: 2,
        currentpage: 1
      }
    );
  });

  it('then it should send 200 if organisation found', async() => {
    await getUsersForOrg(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send users in response if organisation found', async() => {
    await getUsersForOrg(req, res);

    const response = res._getData();
    expect(response).not.toBeNull();
    expect(response.pagedresults.length).toBe(4);
    expect(response.pagedresults[0].id).toBe('A3BAB973-1FB2-4266-8106-B810064FD631');
    expect(response.pagedresults[0].status).toBe(1);
    expect(response.pagedresults[0].role).toBe('End user');
    expect(response.pagedresults[0].name).toBe('Rhys Bridges');
    expect(response.totalNumberOfPages).toBe(2);
    expect(response.currentpage).toBe(1);
  });

  it('then it should log errors and return 500 result', async() => {
    getUsersdetsAssociatedWithOrganisation.mockReset().mockImplementation(() => {
      throw new Error('test');
    });

    await getUsersForOrg(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });
});
