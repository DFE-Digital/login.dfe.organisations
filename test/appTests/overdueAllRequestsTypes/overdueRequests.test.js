const { mockConfig } = require("../../utils");
const {
  pagedListOfRequests,
  pagedListOfServSubServRequests,
  getApproversForOrg,
  updateUserOrgRequest,
  updateUserServSubServRequest,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const { NotificationClient } = require("login.dfe.jobs-client");
const moment = require("moment");
const overdueAllRequestsTypes = require("../../../src/app/overdueAllRequestsTypes/overdueRequests");
const { getUsersRaw } = require("login.dfe.api-client/users");

jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/config", () => mockConfig());
jest.mock("./../../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});
jest.mock("login.dfe.jobs-client");
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

const dateNow = moment();

describe("when calling the overdueAllRequestsTypes function on organisation requests", () => {
  beforeEach(() => {
    NotificationClient.mockReset();
    getUsersRaw.mockReset().mockReturnValue([
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

    getApproversForOrg
      .mockReset()
      .mockReturnValue(["089B72CD-7C80-4348-9C2A-395213B7ECAD"]);

    updateUserOrgRequest.mockReset();
    updateUserServSubServRequest.mockReset();

    pagedListOfRequests.mockReset().mockReturnValue({
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

    pagedListOfServSubServRequests.mockReset().mockReturnValue({
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

  it("should not update the status of the org request if it's in date and has approvers", async () => {
    await overdueAllRequestsTypes();

    expect(updateUserOrgRequest).toHaveBeenCalledTimes(0);
  });

  it("should set the org request to status 3 if the org has no approvers", async () => {
    getApproversForOrg.mockReset().mockReturnValue([]);

    await overdueAllRequestsTypes();

    expect(updateUserOrgRequest).toHaveBeenCalledTimes(1);
  });

  it("should set the org request to status 3 if the org has approvers but they're all deactivated", async () => {
    getApproversForOrg
      .mockReset()
      .mockReturnValue(["089B72CD-7C80-4348-9C2A-395213B7ECAD"]);
    getUsersRaw.mockReset().mockReturnValue([
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

  it("should update the org request to status 2 when overdue", async () => {
    pagedListOfRequests.mockReset().mockReturnValue({
      requests: [
        {
          id: "request-1",
          org_id: "org-1",
          org_name: "org name",
          user_id: "user-1",
          created_date: moment().subtract(5, "days"),
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
    await overdueAllRequestsTypes();

    expect(updateUserOrgRequest).toHaveBeenCalledTimes(1);
    expect(updateUserOrgRequest).toHaveBeenCalledWith("request-1", {
      status: 2,
    });
  });
});

describe("when calling the overdueAllRequestsTypes function on service requests", () => {
  beforeEach(() => {
    NotificationClient.mockReset();
    getUsersRaw.mockReset().mockReturnValue([
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

    getApproversForOrg
      .mockReset()
      .mockReturnValue(["089B72CD-7C80-4348-9C2A-395213B7ECAD"]);

    updateUserOrgRequest.mockReset();
    updateUserServSubServRequest.mockReset();

    pagedListOfServSubServRequests.mockReset().mockReturnValue({
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

    pagedListOfRequests.mockReset().mockReturnValue({
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

  it("should not update the status of the service request if it's in date and has approvers", async () => {
    await overdueAllRequestsTypes();

    expect(updateUserServSubServRequest).toHaveBeenCalledTimes(0);
  });

  it("should set the service request to status 3 if the org has no approvers", async () => {
    getApproversForOrg.mockReset().mockReturnValue([]);
    getUsersRaw.mockReset().mockReturnValue([]);

    await overdueAllRequestsTypes();

    expect(getUsersRaw).toHaveBeenCalledTimes(0);
    expect(updateUserServSubServRequest).toHaveBeenCalledTimes(1);
  });

  it("should set the service request to status 3 if the org has approvers but they're all deactivated", async () => {
    getUsersRaw.mockReset().mockReturnValue([
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

    expect(getUsersRaw).toHaveBeenCalledTimes(1);
    expect(updateUserServSubServRequest).toHaveBeenCalledTimes(1);
  });

  it("should update the service request to status 2 when overdue and give an actioned reason", async () => {
    pagedListOfServSubServRequests.mockReset().mockReturnValue({
      requests: [
        {
          id: "request-1",
          org_id: "org-1",
          org_name: "org name",
          user_id: "user-1",
          created_date: moment().subtract(5, "days"),
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
    await overdueAllRequestsTypes();

    expect(updateUserServSubServRequest).toHaveBeenCalledTimes(1);
    expect(updateUserServSubServRequest).toHaveBeenCalledWith("request-1", {
      actioned_reason: "Overdue",
      status: 2,
    });
  });
});
