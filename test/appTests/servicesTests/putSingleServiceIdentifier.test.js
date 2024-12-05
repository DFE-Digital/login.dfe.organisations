jest.mock("./../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
jest.mock("./../../../src/app/services/data/servicesStorage", () => {
  const upsert = jest.fn();
  const get = jest.fn();
  return {
    upsertExternalIdentifier: jest.fn().mockImplementation(upsert),
    getExternalIdentifier: jest.fn().mockImplementation(get),
  };
});

const servicesStorage = require("./../../../src/app/services/data/servicesStorage");
const httpMocks = require("node-mocks-http");
const putSingleServiceIdentifier = require("./../../../src/app/services/putSingleServiceIdentifier");

describe("when putting a single service identifier", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "60fa3608-f1a0-41d9-a0b5-32a2e04b6c59";

  beforeEach(() => {
    req = {
      params: {
        uid: "User1",
        org_id: "org1",
        sid: "svc1",
      },
      body: {
        id_key: "key1",
        id_value: "value1",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    servicesStorage.upsertExternalIdentifier.mockReset();
    servicesStorage.getExternalIdentifier.mockReset();
    servicesStorage.getExternalIdentifier.mockReturnValue(null);
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });

  it("then it should upsert record with put data", async () => {
    await putSingleServiceIdentifier(req, res);

    expect(servicesStorage.upsertExternalIdentifier.mock.calls).toHaveLength(1);
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][0]).toBe(
      "svc1",
    );
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][1]).toBe(
      "user1",
    );
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][2]).toBe(
      "org1",
    );
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][3]).toBe(
      "key1",
    );
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][4]).toBe(
      "value1",
    );
    expect(servicesStorage.upsertExternalIdentifier.mock.calls[0][5]).toBe(
      expectedRequestCorrelationId,
    );
  });

  it("then if the body key value is not supplied a bad request is returned", async () => {
    req.body = {};

    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(403);
  });

  it("then it should return a 202 response", async () => {
    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(202);
  });

  it("then if the value has already been used and not assigned to that user then a 409 is returned", async () => {
    servicesStorage.getExternalIdentifier.mockReturnValue({ userId: "4rfv" });

    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(409);
  });

  it("then if the user is assigned to that value already then it is updated", async () => {
    servicesStorage.getExternalIdentifier.mockReturnValue({ userId: "user1" });

    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(202);
  });

  it("then it should allow multiple users to be assigned a blank value", async () => {
    req.body.id_value = "";
    servicesStorage.getExternalIdentifier.mockReturnValue({ userId: "dsfsd" });

    await putSingleServiceIdentifier(req, res);

    expect(res.statusCode).toBe(202);
    expect(servicesStorage.getExternalIdentifier.mock.calls).toHaveLength(0);
  });
});
