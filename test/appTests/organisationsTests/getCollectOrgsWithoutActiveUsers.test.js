const mockQuery = jest.fn();

jest.mock("./../../../src/infrastructure/repository", () => ({
  sequelize: { query: mockQuery },
}));
jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/config", () => ({
  legacyServices: { collectServiceId: "test-collect-service-id" },
}));

const getCollectOrgsWithoutActiveUsers = require("./../../../src/app/organisations/getCollectOrgsWithoutActiveUsers");

describe("getCollectOrgsWithoutActiveUsers", () => {
  let req, res;

  beforeEach(() => {
    req = { headers: { "x-correlation-id": "corr-1" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockQuery.mockClear();
  });

  it("returns 200 with the query result", async () => {
    const orgs = [{ org_id: "org-1", org_name: "Test School", urn: "123456" }];
    mockQuery.mockResolvedValue(orgs);

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orgs);
  });

  it("returns 200 with an empty array when no gap orgs exist", async () => {
    mockQuery.mockResolvedValue([]);

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 when the query throws", async () => {
    mockQuery.mockRejectedValue(new Error("DB error"));

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("binds the configured collect service id as a query replacement", async () => {
    mockQuery.mockResolvedValue([]);

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        replacements: { collectServiceId: "test-collect-service-id" },
      }),
    );
  });
});
