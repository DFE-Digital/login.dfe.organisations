jest.mock(
  "./../../../src/infrastructure/config",
  () => () => require("../../utils").mockConfig(),
);

jest.mock("./../../../src/infrastructure/repository", () => {
  return {
    organisations: {
      create: jest.fn(),
    },
  };
});

const {
  add,
} = require("./../../../src/app/organisations/data/organisationsStorage");

const { organisations } = require("./../../../src/infrastructure/repository");

describe("when calling add", () => {
  let org;

  beforeEach(() => {
    org = {
      id: "1234",
      name: "Org-0",
      address: "1 Abbey Road",
      category: { id: "008" },
      status: { id: "1" },
    };

    organisations.create.mockReset();
  });

  it("should add a new organisation", async () => {
    const addResult = await add(org);

    expect(organisations.create).toHaveBeenCalledWith(addResult);
    expect(addResult.name).toBe("Org-0");
    expect(addResult.Address).toBe("1 Abbey Road");
    expect(addResult.Category).toBe("008");
  });
});
