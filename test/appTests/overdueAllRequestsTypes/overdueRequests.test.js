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
  const getApproversForOrg = jest.fn();
  const pagedListOfRequests = jest.fn();
  const updateUserOrgRequest = jest.fn();
  const pagedListOfServSubServRequests = jest.fn();
  const updateUserServSubServRequest = jest.fn();
  return {
    getApproversForOrg: jest.fn().mockImplementation(getApproversForOrg),
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
  getApproversForOrg,
  updateUserOrgRequest,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const { getUsersByIds } = require("../../../src/infrastructure/directories");
const moment = require("moment");

const overdueAllRequestsTypes = require("../../../src/app/overdueAllRequestsTypes/overdueRequests");
const dateNow = moment();

describe("when calling the overdueAllRequestsTypes function", () => {
  beforeEach(() => {
    getUsersByIds.mockReset().mockReturnValue([{}]);

    getApproversForOrg
      .mockReset()
      .mockReturnValue(["089B72CD-7C80-4348-9C2A-395213B7ECAD"]);

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
    updateUserOrgRequest.mockReset();

    pagedListOfRequests.mockReset();
    pagedListOfRequests.mockReturnValue({
      requests: [
        {
          id: "request-1",
          org_id: "org-1",
          org_name: "org name",
          user_id: "user-1",
          created_date: dateNow,
          status: {
            id: 0,
            name: "Pending",
          },
        },
      ],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 30,
    });

    pagedListOfServSubServRequests.mockReset();
    pagedListOfServSubServRequests.mockReturnValue({
      requests: [],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 0,
    });
  });

  it("raises an exception if an exception is raised on any api call", async () => {
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

  it("should set the request to status 3 if the org has no approvers", async () => {
    getApproversForOrg.mockReset();
    getApproversForOrg.mockReturnValue([]);

    await overdueAllRequestsTypes();

    expect(updateUserOrgRequest).toHaveBeenCalledTimes(1);
  });

  it("should set the request to status 3 if the org has approvers but they're all deactivated", async () => {
    getApproversForOrg.mockReset();
    getApproversForOrg.mockReturnValue([
      "089B72CD-7C80-4348-9C2A-395213B7ECAD",
    ]);

    getUsersByIds.mockReset().mockReturnValue([
      {
        sub: "089B72CD-7C80-4348-9C2A-395213B7ECAD",
        given_name: "Eoin",
        family_name: "Corr",
        email: "eoincorr021+17@gmail.com",
        job_title: null,
        status: 0,
        phone_number: null,
        last_login: "2020-02-19T08:53:00.000Z",
        prev_login: null,
        isEntra: false,
        entraOid: null,
        entraLinked: null,
        isInternalUser: false,
        entraDeferUntil: null,
      },
    ]);

    await overdueAllRequestsTypes();

    expect(updateUserOrgRequest).toHaveBeenCalledTimes(1);
  });

  it("should set the request to status 3 if the org has approvers but they're all deactivated", async () => {
    getApproversForOrg.mockReset();
    getApproversForOrg.mockReturnValue([
      "089B72CD-7C80-4348-9C2A-395213B7ECAD",
    ]);

    getUsersByIds.mockReset().mockReturnValue([
      {
        sub: "089B72CD-7C80-4348-9C2A-395213B7ECAD",
        given_name: "Eoin",
        family_name: "Corr",
        email: "eoincorr021+17@gmail.com",
        job_title: null,
        status: 1,
        phone_number: null,
        last_login: "2020-02-19T08:53:00.000Z",
        prev_login: null,
        isEntra: false,
        entraOid: null,
        entraLinked: null,
        isInternalUser: false,
        entraDeferUntil: null,
      },
    ]);

    await overdueAllRequestsTypes();

    expect(updateUserOrgRequest).toHaveBeenCalledTimes(0);
  });
});
