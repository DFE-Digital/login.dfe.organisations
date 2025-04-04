const { mockConfig } = require("../../utils");

jest.mock("assert");
jest.mock("./../../../src/infrastructure/logger", () => {
  return {};
});

describe("When using servicesStorage Data for a user", () => {
  describe("and initialising the class", () => {
    let assertion;
    let assert;

    beforeEach(() => {
      jest.resetModules();

      assertion = false;
      assert = require("assert");
      assert.mockImplementation((paramVal) => {
        if (paramVal === "") {
          assertion = true;
        }
      });
    });

    it("then if the username in config is not supplied the assert is called", () => {
      const configStub = {
        database: {
          username: "",
          password: "123ABVF",
          host: "hostname",
          dialect: "postgres",
        },
      };
      jest.mock("./../../../src/infrastructure/config", () =>
        mockConfig(configStub),
      );

      require("./../../../src/app/services/data/servicesStorage");

      expect(assertion).toBe(true);
    });
    it("then if the password in config is not supplied the assert is called", () => {
      const configStub = {
        database: {
          username: "username",
          password: "",
          host: "hostname",
          dialect: "postgres",
        },
      };
      jest.mock("./../../../src/infrastructure/config", () =>
        mockConfig(configStub),
      );

      require("./../../../src/app/services/data/servicesStorage");

      expect(assertion).toBe(true);
    });
    it("then if the host in config is not supplied the assert is called", () => {
      const configStub = {
        database: {
          username: "username",
          password: "123ABVF",
          host: "",
          dialect: "postgres",
        },
      };
      jest.mock("./../../../src/infrastructure/config", () =>
        mockConfig(configStub),
      );

      require("./../../../src/app/services/data/servicesStorage");

      expect(assertion).toBe(true);
    });
  });
  // describe('and getting data', () => {
  //   let mockConnection;
  //   let storage;
  //
  //   beforeEach(() => {
  //     mockConnection = new SequelizeMock();
  //     const Storage = require('./../../src/app/services/data/servicesStorage');
  //     storage = new Storage(mockConnection);
  //   });
  //   it('returns null if the user service record is not found', async () => {
  //     const result = await storage.getUserAssociatedServices('77d6b281-9f8d-4649-84b8-87fc42eee71d');
  //
  //     expect(result).toBeNull();
  //   });
  // });
});
