const { mockConfig } = require("../../utils");
const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const {
  getUsersByIds,
} = require("../../../src/infrastructure/directories/api");

jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  mockConfig({
    directories: {
      type: "api",
      service: {
        url: "http://directories.test",
        retryFactor: 0,
        numberOfRetries: 2,
      },
    },
  }),
);

const userId = "user1";
const apiResponse = {};

describe("when using the getUsersByIds function", () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue("token"),
      };
    });
  });

  it("then it should call users resource with user id", async () => {
    await getUsersByIds(userId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/users/by-ids",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "POST",
    });
  });
  it("should return undefined when provided with an a falsy value for ids", async () => {
    const testUserIds = undefined;
    const result = await getUsersByIds(testUserIds);
    expect(result).toBe(undefined);
  });

  it("should use the token from jwt strategy as bearer token", async () => {
    await getUsersByIds(userId);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("should return false on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getUsersByIds(userId);
    expect(result).toEqual(undefined);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await getUsersByIds(userId);
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
