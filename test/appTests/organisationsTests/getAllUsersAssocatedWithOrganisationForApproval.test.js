jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => ({
  getUsersPendingApproval: jest.fn(),
}));

const httpMocks = require("node-mocks-http");
const logger = require("./../../../src/infrastructure/logger");
const {
  getUsersPendingApproval,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const get = require("./../../../src/app/organisations/getUsersAssociatedWithOrganisationForApproval");

const userOrgMapping = [
  {
    organisation: {
      id: "org1",
      name: "Organisation One",
    },
    role: {
      id: 0,
      name: "End User",
    },
    userId: "user1",
  },
];

describe("when getting users associated to organisations for approval", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {
        page: 2,
      },
    };

    res = httpMocks.createResponse();

    logger.error.mockReset();

    getUsersPendingApproval
      .mockReset()
      .mockReturnValue({
        usersForApproval: userOrgMapping,
        totalNumberOfRecords: 11,
        totalNumberOfPages: 1,
      });
  });

  it("then it should get a page of users from organisations for approval", async () => {
    await get(req, res);

    expect(getUsersPendingApproval.mock.calls).toHaveLength(1);
  });

  it("then the paged parameters are passed through", async () => {
    await get(req, res);

    expect(getUsersPendingApproval.mock.calls[0][0]).toBe(2);
    expect(getUsersPendingApproval.mock.calls[0][1]).toBe(25);
  });

  it("then it should return user mapping from storage as json", async () => {
    await get(req, res);

    expect(res._isJSON()).toBe(true);
    expect(res._getData().usersForApproval).toEqual(userOrgMapping);
    expect(res._getData().page).toEqual(2);
    expect(res._getData().totalNumberOfRecords).toEqual(11);
    expect(res._getData().totalNumberOfPages).toEqual(1);
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should log errors and return 500 result", async () => {
    getUsersPendingApproval.mockReset().mockImplementation(() => {
      throw new Error("test");
    });

    await get(req, res);

    expect(logger.error.mock.calls).toHaveLength(1);
    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });
});
