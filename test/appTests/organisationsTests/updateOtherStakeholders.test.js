const { mockConfig } = require("../../utils");
const {
  updateOtherStakeholders,
} = require("./../../../src/app/organisations/data/organisationsStorage");

const { Op } = require("sequelize");
const { organisations } = require("./../../../src/infrastructure/repository");

jest.mock("./../../../src/infrastructure/config", () => {
  return mockConfig();
});

jest.mock("./../../../src/infrastructure/repository", () => {
  const { createJestMockForSequelizeEntity } = require("./../../utils/mocks");

  const mockExistingOrg = createJestMockForSequelizeEntity({
    id: "1234",
    name: "Org-1",
    Address: "10 Downing St",
  });

  mockExistingOrg.save = jest.fn().mockResolvedValue(mockExistingOrg);

  return {
    organisations: {
      findOne: jest.fn().mockResolvedValue(mockExistingOrg),
    },
  };
});

describe("when calling updateOtherStakeholders", () => {
  let orgUpdate;

  beforeEach(() => {
    orgUpdate = {
      id: "1234",
      name: "Org-2",
      address: "11 Downing St",
    };

    organisations.findOne.mockReset();
    organisations.findOne.mockResolvedValue({
      id: "1234",
      name: "Org-1",
      Address: "10 Downing St",
      save: jest.fn().mockResolvedValue(true),
    });
  });

  it("should update and save the organisation when found", async () => {
    await updateOtherStakeholders(orgUpdate);

    expect(organisations.findOne).toHaveBeenCalledWith({
      where: {
        id: {
          [Op.eq]: orgUpdate.id,
        },
      },
    });
  });

  it("should throw an error if no existing organisation is found", async () => {
    organisations.findOne.mockResolvedValue(null);

    await expect(updateOtherStakeholders(orgUpdate)).rejects.toThrow(
      `Cannot find organisation in database with id ${orgUpdate.id}`,
    );
  });
});
