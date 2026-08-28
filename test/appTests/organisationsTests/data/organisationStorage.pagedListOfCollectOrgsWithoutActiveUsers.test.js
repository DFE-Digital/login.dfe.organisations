const mockQuery = jest.fn();

jest.mock("./../../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("./../../../../src/infrastructure/repository", () => ({
  sequelize: { query: mockQuery },
}));

const {
  pagedListOfCollectOrgsWithoutActiveUsers,
} = require("./../../../../src/app/organisations/data/organisationsStorage");

const collectServiceId = "collect-service-id";
const orgRow = { org_id: "org-1", org_name: "Test School" };

const dataSqlOf = (call) => call[0];
const replacementsOf = (call) => call[1].replacements;

describe("When listing Collect organisations without active users", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    // First call is the page of rows, second is the count.
    mockQuery
      .mockResolvedValueOnce([orgRow])
      .mockResolvedValueOnce([{ total: 6083 }]);
  });

  it("returns the rows with the total record and page counts", async () => {
    const result = await pagedListOfCollectOrgsWithoutActiveUsers(
      collectServiceId,
      1,
      25,
    );

    expect(result).toEqual({
      organisations: [orgRow],
      totalNumberOfPages: 244,
      totalNumberOfRecords: 6083,
    });
  });

  it("offsets by the requested page", async () => {
    await pagedListOfCollectOrgsWithoutActiveUsers(collectServiceId, 3, 25);

    expect(replacementsOf(mockQuery.mock.calls[0])).toEqual({
      collectServiceId,
      offset: 50,
      limit: 25,
    });
  });

  it("treats a user as covering the organisation only when the user is active too", async () => {
    // Deactivating a user changes only the user record - their user_services
    // row stays active. Checking the access row alone would hide exactly the
    // organisations this report exists to surface.
    await pagedListOfCollectOrgsWithoutActiveUsers(collectServiceId, 1, 25);

    const sql = dataSqlOf(mockQuery.mock.calls[0]);
    expect(sql).toContain("JOIN dbo.[user] u ON u.sub = us.user_id");
    expect(sql).toContain("AND us.status = 1");
    expect(sql).toContain("AND u.status = 1");
  });

  it("restricts to the Collect-eligible organisation categories", async () => {
    await pagedListOfCollectOrgsWithoutActiveUsers(collectServiceId, 1, 25);

    expect(dataSqlOf(mockQuery.mock.calls[0])).toContain(
      "o.Category IN ('001', '002')",
    );
  });

  it("counts against the same filter as the page of rows", async () => {
    await pagedListOfCollectOrgsWithoutActiveUsers(collectServiceId, 1, 25);

    const [dataCall, countCall] = mockQuery.mock.calls;
    expect(dataSqlOf(countCall)).toContain("COUNT_BIG(1)");
    // Both queries share one FROM/WHERE fragment, so the filters cannot drift.
    expect(dataSqlOf(dataCall)).toContain("NOT EXISTS");
    expect(dataSqlOf(countCall)).toContain("NOT EXISTS");
  });
});
