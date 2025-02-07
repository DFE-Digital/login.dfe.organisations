jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").mockConfig(),
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
  const pagedListOfServSubServRequests = jest.fn();
  return {
    pagedListOfRequests: jest.fn().mockImplementation(pagedListOfRequests),
    pagedListOfServSubServRequests: jest
      .fn()
      .mockImplementation(pagedListOfServSubServRequests),
  };
});

const {
  pagedListOfRequests,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const { getUsersByIds } = require("../../../src/infrastructure/directories");

const overdueAllRequestsTypes = require("../../../src/app/overdueAllRequestsTypes/overdueRequests");

describe("when calling the overdueAllRequestsTypes function", () => {
  beforeEach(() => {
    getUsersByIds.mockReset();
    getUsersByIds.mockReturnValue([{}]);

    pagedListOfRequests.mockReset();
    pagedListOfRequests.mockReturnValue({
      requests: [
        {
          id: "requestId",
          org_id: "org1",
          org_name: "org name",
          user_id: "user 1",
          created_at: "12/12/2019",
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

  //   expect(res._isEndCalled()).toBe(true);
  //   expect(res.statusCode).toBe(200);

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
