jest.mock(
  "./../../../src/infrastructure/config",
  () => () => require("../../utils").mockConfig(),
);
jest.mock("./../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});
jest.mock("../../../src/infrastructure/directories");
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  const pagedListOfRequests = jest.fn();
  const updateUserOrgRequest = jest.fn();
  const pagedListOfServSubServRequests = jest.fn();
  const updateUserServSubServRequest = jest.fn();
  return {
    updateUserOrgRequest: jest.fn().mockImplementation(updateUserOrgRequest),
    updateUserServSubServRequest: jest
      .fn()
      .mockImplementation(updateUserServSubServRequest),
    pagedListOfRequests: jest.fn().mockImplementation(pagedListOfRequests),
    pagedListOfServSubServRequests: jest
      .fn()
      .mockImplementation(pagedListOfServSubServRequests),
  };
});

const {
  pagedListOfRequests,
  pagedListOfServSubServRequests,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const { getUsersByIds } = require("../../../src/infrastructure/directories");

const overdueAllRequestsTypes = require("../../../src/app/overdueAllRequestsTypes/overdueRequests");

describe("when calling the overdueAllRequestsTypes function", () => {
  beforeEach(() => {
    getUsersByIds.mockReset();
    getUsersByIds.mockReturnValue([{}]);

    // request
    // {
    //   id: '558910BF-172D-4405-9276-4A3650B9E2B3',
    //   org_id: 'E41782FC-1A18-4E30-A315-CCC624AD7516',
    //   org_name: 'Abbeywood Community School',
    //   user_id: '6BEA40AE-947D-4767-9A97-C52FCED78B33',
    //   created_date: 2025-03-11T16:33:16.492Z,
    //   status: { id: 0, name: 'Pending' },
    //   reason: 'Another reason'
    // }

    // approversForOrg
    // [
    //   '089B72CD-7C80-4348-9C2A-395213B7ECAD',
    //   '727A9392-63A4-4B91-BAAF-6D9CA675DFE0',
    //   'CA518CBE-83E0-4271-8327-7C09D0A641C7',
    //   '3BDAD46B-D9AD-44B6-9D27-B5FF14CD945E',
    //   '5A5C8CDE-1535-48B5-A5DB-D75360DFBB63'
    // ]

    //approversDetails
    // [
    //   {
    //     sub: '089B72CD-7C80-4348-9C2A-395213B7ECAD',
    //     given_name: 'Eoin',
    //     family_name: 'Corr',
    //     email: 'eoincorr021+17@gmail.com',
    //     job_title: null,
    //     status: 0,
    //     phone_number: null,
    //     last_login: '2020-02-19T08:53:00.000Z',
    //     prev_login: null,
    //     isEntra: false,
    //     entraOid: null,
    //     entraLinked: null,
    //     isInternalUser: false,
    //     entraDeferUntil: null
    //   },
    //   {
    //     sub: '727A9392-63A4-4B91-BAAF-6D9CA675DFE0',
    //     given_name: 'Test2505',
    //     family_name: 'user6',
    //     email: 'Test2505user6@yopmail.com',
    //     job_title: null,
    //     status: 1,
    //     phone_number: null,
    //     last_login: '2021-06-14T13:49:00.000Z',
    //     prev_login: null,
    //     isEntra: false,
    //     entraOid: null,
    //     entraLinked: null,
    //     isInternalUser: false,
    //     entraDeferUntil: null
    //   }]

    pagedListOfRequests.mockReset();
    pagedListOfRequests.mockReturnValue({
      requests: [
        {
          id: "requestId",
          org_id: "org1",
          org_name: "org name",
          user_id: "user 1",
          created_date: "2021-06-27 14:10:08.4870000",
          status: {
            id: 2,
            name: "escalated",
          },
        },
      ],
      page: 1,
      totalNumberOfPages: 2,
      totalNumberOfRecords: 30,
    });

    pagedListOfServSubServRequests.mockReset();
    pagedListOfServSubServRequests.mockReturnValue({
      requests: [
        {
          id: "requestId",
          org_id: "org1",
          org_name: "org name",
          user_id: "user 1",
          created_date: "2022-06-27 14:10:08.4870000",
          status: {
            id: 2,
            name: "escalated",
          },
        },
      ],
      page: 1,
      totalNumberOfPages: 2,
      totalNumberOfRecords: 30,
    });
  });

  // it("then it should map services from storage", async () => {
  //   await overdueAllRequestsTypes();

  //   const result = true;
  //   expect(result).toBe(true);
  // });

  it("then it raise an exception if an exception is raised on any api call", async () => {
    pagedListOfRequests.mockReset().mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await overdueAllRequestsTypes();
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
