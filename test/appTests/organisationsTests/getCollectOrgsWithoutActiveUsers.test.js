jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => ({
  pagedListOfCollectOrgsWithoutActiveUsers: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/config", () => ({
  legacyServices: { collectServiceId: "test-collect-service-id" },
}));

const organisationsStorage = require("./../../../src/app/organisations/data/organisationsStorage");
const getCollectOrgsWithoutActiveUsers = require("./../../../src/app/organisations/getCollectOrgsWithoutActiveUsers");

const pagedList = organisationsStorage.pagedListOfCollectOrgsWithoutActiveUsers;

const emptyPage = {
  organisations: [],
  totalNumberOfPages: 0,
  totalNumberOfRecords: 0,
};

describe("getCollectOrgsWithoutActiveUsers", () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, get: jest.fn().mockReturnValue("corr-1") };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    pagedList.mockReset().mockResolvedValue(emptyPage);
  });

  it("returns 200 with the paged result", async () => {
    const page = {
      organisations: [
        { org_id: "org-1", org_name: "Test School", urn: "123456" },
      ],
      totalNumberOfPages: 1,
      totalNumberOfRecords: 1,
    };
    pagedList.mockResolvedValue(page);

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(page);
  });

  it("returns 200 with an empty page when no gap orgs exist", async () => {
    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(emptyPage);
  });

  it("defaults to page 1 with a page size of 25", async () => {
    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(pagedList).toHaveBeenCalledWith("test-collect-service-id", 1, 25);
  });

  it("passes the requested page and page size through", async () => {
    req.query = { page: "3", pageSize: "50" };

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(pagedList).toHaveBeenCalledWith("test-collect-service-id", 3, 50);
  });

  it("returns 400 when the page number is below 1", async () => {
    req.query = { page: "0" };

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pagedList).not.toHaveBeenCalled();
  });

  it("returns 400 when the page size is above 50", async () => {
    req.query = { pageSize: "51" };

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pagedList).not.toHaveBeenCalled();
  });

  it("returns 500 when the storage call throws", async () => {
    pagedList.mockRejectedValue(new Error("DB error"));

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("does not put the underlying error detail in the 500 response", async () => {
    pagedList.mockRejectedValue(
      new Error("Invalid column name 'DistrictAdministrativeCode'"),
    );

    await getCollectOrgsWithoutActiveUsers(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("Invalid column");
  });
});
