const { mockConfig } = require("../../../utils");
const {
  update,
} = require("../../../../src/app/organisations/data/organisationsStorage");

const { Op } = require("sequelize");
const { organisations } = require("../../../../src/infrastructure/repository");
jest.mock("./../../../../src/infrastructure/config", () => mockConfig());

jest.mock("./../../../../src/infrastructure/repository", () => {
  const { createJestMockForSequelizeEntity } = require("../../../utils/mocks");

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

describe("when calling update", () => {
  let orgUpdate;

  beforeEach(() => {
    orgUpdate = {
      id: "1234",
      name: "Org-2",
      address: "11 Downing St",
      category: { id: "008" },
      status: { id: "1" },
    };

    organisations.findOne.mockReset();
    organisations.findOne.mockResolvedValue({
      id: "1234",
      name: "Org-1",
      Address: "10 Downing St",
      save: jest.fn().mockResolvedValue(true),
    });
  });

  it("should update and save the organisation if found", async () => {
    await update(orgUpdate);

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

    await expect(update(orgUpdate)).rejects.toThrow(
      `Cannot find organisation in database with id ${orgUpdate.id}`,
    );
  });
});
