jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    pagedListOfAllRequestTypes: jest.fn(),
  };
});

const res = {
  json: jest.fn(),
  status: jest.fn(),
  send: jest.fn(),
  contentType: jest.fn(),
  mockResetAll: function () {
    this.json.mockReset().mockReturnValue(this);
    this.status.mockReset().mockReturnValue(this);
    this.send.mockReset().mockReturnValue(this);
    this.contentType.mockReset().mockReturnValue(this);
  },
};
const {
  pagedListOfAllRequestTypes,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const getRequestsForSupport = require("../../../src/app/organisations/listRequests");

describe("when getting requests that have been escalated to support", () => {
  let req;
  const expectedRequestCorrelationId = "392f0e46-787b-41bc-9e77-4c3cb94824bb";

  beforeEach(() => {
    res.mockResetAll();
    req = {
      params: {
        id: "1d672383-cf21-49b4-86d2-7cea955ad422",
      },
      query: {},
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    pagedListOfAllRequestTypes.mockReset();

    pagedListOfAllRequestTypes.mockReturnValue({
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

  it("then it should return first page of requests if no page specified", async () => {
    await getRequestsForSupport(req, res);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
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

  it("then it should filter by status if specified in query", async () => {
    req.query.filterstatus = "2";

    await getRequestsForSupport(req, res);

    expect(pagedListOfAllRequestTypes.mock.calls).toHaveLength(1);
    expect(pagedListOfAllRequestTypes.mock.calls[0][0]).toBe(1);
    expect(pagedListOfAllRequestTypes.mock.calls[0][1]).toBe(25);
    expect(pagedListOfAllRequestTypes.mock.calls[0][2]).toEqual(["2"]);
  });

  it("then it should get page specified in query", async () => {
    req.query.page = "2";

    await getRequestsForSupport(req, res);

    expect(pagedListOfAllRequestTypes.mock.calls).toHaveLength(1);
    expect(pagedListOfAllRequestTypes.mock.calls[0][0]).toBe(2);
    expect(pagedListOfAllRequestTypes.mock.calls[0][1]).toBe(25);
    expect(pagedListOfAllRequestTypes.mock.calls[0][2]).toEqual([]);
  });

  it("then it should filter by type if specified in query", async () => {
    req.query.filtertype = "service";

    await getRequestsForSupport(req, res);

    expect(pagedListOfAllRequestTypes.mock.calls).toHaveLength(1);
    expect(pagedListOfAllRequestTypes.mock.calls[0][3]).toEqual(["service"]);
  });

  it("then it should pass filterUserId to pagedListOfAllRequestTypes when filteruserid is in query", async () => {
    req.query.filteruserid = "user-abc-123";

    await getRequestsForSupport(req, res);

    expect(pagedListOfAllRequestTypes.mock.calls).toHaveLength(1);
    expect(pagedListOfAllRequestTypes.mock.calls[0][4]).toBe("user-abc-123");
  });

  it("then it should pass undefined as filterUserId when filteruserid is absent from query", async () => {
    await getRequestsForSupport(req, res);

    expect(pagedListOfAllRequestTypes.mock.calls).toHaveLength(1);
    expect(pagedListOfAllRequestTypes.mock.calls[0][4]).toBeUndefined();
  });
});
