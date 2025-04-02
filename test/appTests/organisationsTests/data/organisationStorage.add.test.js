const { mockConfig } = require("../../../utils");
const {
  add,
} = require("../../../../src/app/organisations/data/organisationsStorage");
const { organisations } = require("../../../../src/infrastructure/repository");

jest.mock("./../../../../src/infrastructure/config", () => mockConfig());

jest.mock("./../../../../src/infrastructure/repository", () => {
  return {
    organisations: {
      create: jest.fn(),
    },
  };
});

describe("when calling add", () => {
  let org;
  let entity;

  beforeEach(() => {
    org = {
      id: "1234",
      name: "Org-0",
      Address: "1 Abbey Road",
      category: { id: "008" },
      status: { id: "1" },
    };
    entity = {
      id: "1234",
      name: "Org-0",
      LegalName: undefined,
      Category: "008",
      Type: null,
      URN: undefined,
      UID: undefined,
      UPIN: undefined,
      UKPRN: undefined,
      EstablishmentNumber: undefined,
      Status: "1",
      ClosedOn: undefined,
      Address: undefined,
      telephone: undefined,
      regionCode: null,
      phaseOfEducation: null,
      statutoryLowAge: undefined,
      statutoryHighAge: undefined,
      legacyId: undefined,
      companyRegistrationNumber: undefined,
      SourceSystem: undefined,
      ProviderTypeName: undefined,
      ProviderTypeCode: undefined,
      GIASProviderType: undefined,
      PIMSProviderType: undefined,
      PIMSProviderTypeCode: undefined,
      PIMSStatusName: undefined,
      PIMSStatus: undefined,
      GIASStatusName: undefined,
      GIASStatus: undefined,
      MasterProviderStatusName: undefined,
      MasterProviderStatusCode: undefined,
      OpenedOn: undefined,
      DistrictAdministrativeName: undefined,
      DistrictAdministrativeCode: undefined,
      DistrictAdministrative_code: undefined,
      IsOnAPAR: undefined,
    };

    organisations.create.mockReset();
  });

  it("should add a new organisation", async () => {
    await add(org);

    expect(organisations.create).toHaveBeenCalledWith(entity);
  });
});
