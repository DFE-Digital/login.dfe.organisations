jest.mock(
  "./../../../src/infrastructure/config",
  () => () => require("../../utils").mockConfig(),
);

jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => ({
  updateEntityWithUpdatedFields: jest.fn(),
}));

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

const {
  updateOtherStakeholders,
  updateEntityWithUpdatedFields,
} = require("./../../../src/app/organisations/data/organisationsStorage");

const { Op } = require("sequelize");
const { organisations } = require("./../../../src/infrastructure/repository");

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

    updateEntityWithUpdatedFields.mockReset();
    updateEntityWithUpdatedFields.mockResolvedValue(() => {});
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
});
