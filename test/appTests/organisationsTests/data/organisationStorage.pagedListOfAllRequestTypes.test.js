jest.mock("./../../../../src/infrastructure/repository", () => ({
  userOrganisationRequests: { findAll: jest.fn() },
  userServiceRequests: { findAll: jest.fn() },
  organisationRequestStatus: [],
  serviceRequestStatus: [],
  serviceRequestsTypes: [],
}));
jest.mock("./../../../../src/infrastructure/logger");

const {
  userOrganisationRequests,
  userServiceRequests,
} = require("./../../../../src/infrastructure/repository");
const {
  pagedListOfAllRequestTypes,
} = require("./../../../../src/app/organisations/data/organisationsStorage");

describe("pagedListOfAllRequestTypes - filterUserId", () => {
  beforeEach(() => {
    userOrganisationRequests.findAll.mockReset().mockResolvedValue([]);
    userServiceRequests.findAll.mockReset().mockResolvedValue([]);
  });

  it("does not add user_id to org query when filterUserId is not provided", async () => {
    await pagedListOfAllRequestTypes(1, 25, undefined, undefined, undefined);

    const orgQuery = userOrganisationRequests.findAll.mock.calls[0][0];
    expect(orgQuery.where).not.toHaveProperty("user_id");
  });

  it("adds user_id WHERE clause to org query when filterUserId is provided", async () => {
    await pagedListOfAllRequestTypes(1, 25, undefined, undefined, "user-abc-123");

    const orgQuery = userOrganisationRequests.findAll.mock.calls[0][0];
    expect(orgQuery.where.user_id).toBe("user-abc-123");
  });

  it("adds user_id WHERE clause to service query when filterUserId is provided", async () => {
    await pagedListOfAllRequestTypes(1, 25, undefined, ["service"], "user-abc-123");

    const servQuery = userServiceRequests.findAll.mock.calls[0][0];
    expect(servQuery.where.user_id).toBe("user-abc-123");
  });

  it("adds user_id WHERE clause to service query when filterTypes is undefined", async () => {
    await pagedListOfAllRequestTypes(1, 25, undefined, undefined, "user-abc-123");

    const servQuery = userServiceRequests.findAll.mock.calls[0][0];
    expect(servQuery.where.user_id).toBe("user-abc-123");
  });

  it("combines user_id filter with status filter on org query", async () => {
    await pagedListOfAllRequestTypes(1, 25, ["0"], undefined, "user-abc-123");

    const orgQuery = userOrganisationRequests.findAll.mock.calls[0][0];
    expect(orgQuery.where.user_id).toBe("user-abc-123");
    expect(orgQuery.where).toHaveProperty("status");
  });
});
