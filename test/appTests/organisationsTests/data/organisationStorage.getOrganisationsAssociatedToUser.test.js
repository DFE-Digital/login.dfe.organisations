const { Op } = require("sequelize");
const { mockConfig } = require("../../../utils");
const {
  getOrganisationsAssociatedToUser,
} = require("../../../../src/app/organisations/data/organisationsStorage");
const {
  userOrganisations,
  organisations,
} = require("../../../../src/infrastructure/repository");

jest.mock("../../../../src/infrastructure/config", () => mockConfig());
jest.mock("../../../../src/infrastructure/repository", () => ({
  userOrganisations: {
    findAll: jest.fn(),
  },
  organisations: {
    findAll: jest.fn(),
  },
  organisationStatus: [
    { id: 1, name: "Open", tagColor: "green" },
    { id: 2, name: "Closed", tagColor: "red" },
  ],
  organisationCategory: [
    { id: "001", name: "Establishment" },
    { id: "002", name: "Local Authority" },
  ],
  establishmentTypes: [
    { id: "01", name: "Community School" },
    { id: "02", name: "Voluntary Aided School" },
  ],
  regionCodes: [
    { id: "A", name: "North East" },
    { id: "B", name: "North West" },
  ],
  phasesOfEducation: [
    { id: 0, name: "Not applicable" },
    { id: 1, name: "Nursery" },
  ],
}));

describe("getOrganisationsAssociatedToUser.test.js", () => {
  const minimalUserOrgData = {
    Organisation: {},
    getRole: jest.fn(),
    getApprovers: jest.fn().mockResolvedValue([]),
    getEndUsers: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    minimalUserOrgData.Organisation = {};
    minimalUserOrgData.getRole = jest.fn();
    minimalUserOrgData.getApprovers = jest.fn().mockResolvedValue([]);
    minimalUserOrgData.getEndUsers = jest.fn().mockResolvedValue([]);

    userOrganisations.findAll.mockResolvedValue([]);
    organisations.findAll.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Calls the database with the user's ID to retrieve user/organisation information including the org associations.", async () => {
    const userId = "test-user";
    await getOrganisationsAssociatedToUser(userId);

    expect(userOrganisations.findAll).toHaveBeenCalled();
    expect(userOrganisations.findAll).toHaveBeenCalledWith({
      where: {
        user_id: {
          [Op.eq]: userId,
        },
      },
      include: [
        {
          model: expect.any(Object),
          as: "Organisation",
          include: "associations",
        },
      ],
      order: [["Organisation", "name", "ASC"]],
    });
  });

  it("Returns an empty array if no records are found for the user.", async () => {
    userOrganisations.findAll.mockResolvedValue([]);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result).toStrictEqual([]);
  });

  it("Returns the approver IDs for each organisation associated with the user.", async () => {
    const approverDataOrg1 = [
      { user_id: "approver-1" },
      { user_id: "approver-2" },
    ];
    const approverDataOrg2 = [
      { user_id: "approver-3" },
      { user_id: "approver-4" },
    ];
    const userOrgData = [
      {
        ...minimalUserOrgData,
        getApprovers: jest.fn().mockResolvedValue(approverDataOrg1),
      },
      {
        ...minimalUserOrgData,
        getApprovers: jest.fn().mockResolvedValue(approverDataOrg2),
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(userOrgData[0].getApprovers).toHaveBeenCalled();
    expect(userOrgData[1].getApprovers).toHaveBeenCalled();
    expect(result[0].approvers).toStrictEqual(
      approverDataOrg1.map((approverInfo) => approverInfo.user_id),
    );
    expect(result[1].approvers).toStrictEqual(
      approverDataOrg2.map((approverInfo) => approverInfo.user_id),
    );
  });

  it("Returns the end user IDs for each organisation associated with the user.", async () => {
    const userDataOrg1 = [{ user_id: "user-1" }, { user_id: "user-2" }];
    const userDataOrg2 = [{ user_id: "user-3" }, { user_id: "user-4" }];
    const userOrgData = [
      {
        ...minimalUserOrgData,
        getEndUsers: jest.fn().mockResolvedValue(userDataOrg1),
      },
      {
        ...minimalUserOrgData,
        getEndUsers: jest.fn().mockResolvedValue(userDataOrg2),
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(userOrgData[0].getEndUsers).toHaveBeenCalled();
    expect(userOrgData[1].getEndUsers).toHaveBeenCalled();
    expect(result[0].endUsers).toStrictEqual(
      userDataOrg1.map((userInfo) => userInfo.user_id),
    );
    expect(result[1].endUsers).toStrictEqual(
      userDataOrg2.map((userInfo) => userInfo.user_id),
    );
  });

  it("Returns the translated organisation data if a mapped value is found.", async () => {
    const userOrgData = [
      {
        ...minimalUserOrgData,
        Organisation: {
          Category: "001",
          Type: "01",
          Status: 1,
          regionCode: "A",
          phaseOfEducation: 1,
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          Category: "002",
          Type: "02",
          Status: 2,
          regionCode: "B",
          phaseOfEducation: 0,
        },
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].organisation).toMatchObject({
      category: { id: "001", name: "Establishment" },
      type: { id: "01", name: "Community School" },
      status: { id: 1, name: "Open", tagColor: "green" },
      region: { id: "A", name: "North East" },
      phaseOfEducation: { id: 1, name: "Nursery" },
    });
    expect(result[1].organisation).toMatchObject({
      category: { id: "002", name: "Local Authority" },
      type: { id: "02", name: "Voluntary Aided School" },
      status: { id: 2, name: "Closed", tagColor: "red" },
      region: { id: "B", name: "North West" },
      phaseOfEducation: { id: 0, name: "Not applicable" },
    });
  });

  it("Returns the translated organisation data as default values if a mapped value isn't found.", async () => {
    const userOrgData = [
      {
        ...minimalUserOrgData,
        Organisation: {
          Category: "100",
          Type: "99",
          Status: 6,
          regionCode: "X",
          phaseOfEducation: 10,
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          Category: null,
          Type: null,
          Status: 12,
          regionCode: null,
          phaseOfEducation: null,
        },
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].organisation).toMatchObject({
      category: { id: "100", name: "Unknown" },
      type: undefined,
      status: undefined,
      region: undefined,
      phaseOfEducation: undefined,
    });
    expect(result[1].organisation).toMatchObject({
      category: { id: null, name: "Unknown" },
      type: undefined,
      status: undefined,
      region: undefined,
      phaseOfEducation: undefined,
    });
  });

  it("Returns the static organisation data in the correct shape.", async () => {
    const userOrgData = [
      {
        ...minimalUserOrgData,
        Organisation: {
          id: "org-1",
          name: "Organisation One",
          LegalName: null,
          URN: null,
          UID: null,
          UPIN: null,
          UKPRN: null,
          EstablishmentNumber: null,
          ClosedOn: null,
          Address: null,
          telephone: null,
          statutoryLowAge: null,
          statutoryHighAge: null,
          legacyId: null,
          companyRegistrationNumber: null,
          SourceSystem: null,
          providerTypeName: null,
          ProviderTypeCode: null,
          GIASProviderType: null,
          PIMSProviderType: null,
          PIMSProviderTypeCode: null,
          PIMSStatusName: null,
          pimsStatus: null,
          GIASStatusName: null,
          GIASStatus: null,
          MasterProviderStatusName: null,
          MasterProviderStatusCode: null,
          OpenedOn: null,
          DistrictAdministrativeName: null,
          DistrictAdministrativeCode: null,
          DistrictAdministrative_code: null,
          IsOnAPAR: null,
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          id: "org-2",
          name: "Organisation Two",
          LegalName: "Legal Name",
          URN: "123456",
          UID: "123",
          UPIN: "123456",
          UKPRN: "12345678",
          EstablishmentNumber: "123",
          ClosedOn: "2025-12-10",
          Address: "address",
          telephone: "01234567891",
          statutoryLowAge: 1,
          statutoryHighAge: 99,
          legacyId: 123,
          companyRegistrationNumber: "123456",
          SourceSystem: "Source",
          providerTypeName: "Provider Type",
          ProviderTypeCode: 1,
          GIASProviderType: "Example",
          PIMSProviderType: "Example",
          PIMSProviderTypeCode: 1,
          PIMSStatusName: "Open",
          pimsStatus: 1,
          GIASStatusName: "Open",
          GIASStatus: 1,
          MasterProviderStatusName: "Open",
          MasterProviderStatusCode: 1,
          OpenedOn: "2025-12-10",
          DistrictAdministrativeName: "London",
          DistrictAdministrativeCode: "E00000000",
          DistrictAdministrative_code: "E00000000",
          IsOnAPAR: "YES",
        },
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].organisation).toMatchObject({
      id: userOrgData[0].Organisation.id,
      name: userOrgData[0].Organisation.name,
      LegalName: userOrgData[0].Organisation.LegalName,
      urn: userOrgData[0].Organisation.URN,
      uid: userOrgData[0].Organisation.UID,
      upin: userOrgData[0].Organisation.UPIN,
      ukprn: userOrgData[0].Organisation.UKPRN,
      establishmentNumber: userOrgData[0].Organisation.EstablishmentNumber,
      closedOn: userOrgData[0].Organisation.ClosedOn,
      address: userOrgData[0].Organisation.Address,
      telephone: userOrgData[0].Organisation.telephone,
      statutoryLowAge: userOrgData[0].Organisation.statutoryLowAge,
      statutoryHighAge: userOrgData[0].Organisation.statutoryHighAge,
      legacyId: userOrgData[0].Organisation.legacyId,
      companyRegistrationNumber:
        userOrgData[0].Organisation.companyRegistrationNumber,
      SourceSystem: userOrgData[0].Organisation.SourceSystem,
      providerTypeName: userOrgData[0].Organisation.ProviderTypeName,
      ProviderTypeCode: userOrgData[0].Organisation.ProviderTypeCode,
      GIASProviderType: userOrgData[0].Organisation.GIASProviderType,
      PIMSProviderType: userOrgData[0].Organisation.PIMSProviderType,
      PIMSProviderTypeCode: userOrgData[0].Organisation.PIMSProviderTypeCode,
      PIMSStatusName: userOrgData[0].Organisation.PIMSStatusName,
      pimsStatus: userOrgData[0].Organisation.PIMSStatus,
      GIASStatusName: userOrgData[0].Organisation.GIASStatusName,
      GIASStatus: userOrgData[0].Organisation.GIASStatus,
      MasterProviderStatusName:
        userOrgData[0].Organisation.MasterProviderStatusName,
      MasterProviderStatusCode:
        userOrgData[0].Organisation.MasterProviderStatusCode,
      OpenedOn: userOrgData[0].Organisation.OpenedOn,
      DistrictAdministrativeName:
        userOrgData[0].Organisation.DistrictAdministrativeName,
      DistrictAdministrativeCode:
        userOrgData[0].Organisation.DistrictAdministrativeCode,
      DistrictAdministrative_code:
        userOrgData[0].Organisation.DistrictAdministrative_code,
      IsOnAPAR: userOrgData[0].Organisation.IsOnAPAR,
    });
    expect(result[1].organisation).toMatchObject({
      id: userOrgData[1].Organisation.id,
      name: userOrgData[1].Organisation.name,
      LegalName: userOrgData[1].Organisation.LegalName,
      urn: userOrgData[1].Organisation.URN,
      uid: userOrgData[1].Organisation.UID,
      upin: userOrgData[1].Organisation.UPIN,
      ukprn: userOrgData[1].Organisation.UKPRN,
      establishmentNumber: userOrgData[1].Organisation.EstablishmentNumber,
      closedOn: userOrgData[1].Organisation.ClosedOn,
      address: userOrgData[1].Organisation.Address,
      telephone: userOrgData[1].Organisation.telephone,
      statutoryLowAge: userOrgData[1].Organisation.statutoryLowAge,
      statutoryHighAge: userOrgData[1].Organisation.statutoryHighAge,
      legacyId: userOrgData[1].Organisation.legacyId,
      companyRegistrationNumber:
        userOrgData[1].Organisation.companyRegistrationNumber,
      SourceSystem: userOrgData[1].Organisation.SourceSystem,
      providerTypeName: userOrgData[1].Organisation.ProviderTypeName,
      ProviderTypeCode: userOrgData[1].Organisation.ProviderTypeCode,
      GIASProviderType: userOrgData[1].Organisation.GIASProviderType,
      PIMSProviderType: userOrgData[1].Organisation.PIMSProviderType,
      PIMSProviderTypeCode: userOrgData[1].Organisation.PIMSProviderTypeCode,
      PIMSStatusName: userOrgData[1].Organisation.PIMSStatusName,
      pimsStatus: userOrgData[1].Organisation.PIMSStatus,
      GIASStatusName: userOrgData[1].Organisation.GIASStatusName,
      GIASStatus: userOrgData[1].Organisation.GIASStatus,
      MasterProviderStatusName:
        userOrgData[1].Organisation.MasterProviderStatusName,
      MasterProviderStatusCode:
        userOrgData[1].Organisation.MasterProviderStatusCode,
      OpenedOn: userOrgData[1].Organisation.OpenedOn,
      DistrictAdministrativeName:
        userOrgData[1].Organisation.DistrictAdministrativeName,
      DistrictAdministrativeCode:
        userOrgData[1].Organisation.DistrictAdministrativeCode,
      DistrictAdministrative_code:
        userOrgData[1].Organisation.DistrictAdministrative_code,
      IsOnAPAR: userOrgData[1].Organisation.IsOnAPAR,
    });
  });

  it("Calls the database with unique local authority IDs to map the information to the organisations.", async () => {
    const localAuthorityIds = ["LA-1", "LA-2", "LA-3"];
    const userOrgData = [
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityIds[0],
              link_type: "LA",
            },
          ],
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityIds[0],
              link_type: "LA",
            },
          ],
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityIds[1],
              link_type: "LA",
            },
          ],
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityIds[2],
              link_type: "LA",
            },
          ],
        },
        getRole: jest.fn(),
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: "Other-1",
              link_type: "Other",
            },
          ],
        },
        getRole: jest.fn(),
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    await getOrganisationsAssociatedToUser("");

    expect(organisations.findAll).toHaveBeenCalled();
    expect(organisations.findAll).toHaveBeenCalledWith({
      where: {
        id: {
          [Op.in]: localAuthorityIds,
        },
      },
    });
  });

  it("Replaces a LA linked organisation's localAuthority property with the ID, name, and code if the local authority organisation was found", async () => {
    const localAuthorityData = [
      { id: "LA-1", name: "LA One", code: "1" },
      { id: "LA-2", name: "LA Two", code: "2" },
    ];
    const userOrgData = [
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityData[0].id,
              link_type: "LA",
            },
          ],
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityData[0].id,
              link_type: "LA",
            },
          ],
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: localAuthorityData[1].id,
              link_type: "LA",
            },
          ],
        },
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    organisations.findAll.mockResolvedValue(
      localAuthorityData.map((la) => ({
        id: la.id,
        name: la.name,
        EstablishmentNumber: la.code,
      })),
    );
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].organisation.localAuthority).toStrictEqual(
      localAuthorityData[0],
    );
    expect(result[1].organisation.localAuthority).toStrictEqual(
      localAuthorityData[0],
    );
    expect(result[2].organisation.localAuthority).toStrictEqual(
      localAuthorityData[1],
    );
  });

  it("Replaces a LA linked organisation's localAuthority property with the ID only if the local authority organisation was not found", async () => {
    const userOrgData = [
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: "LA-1",
              link_type: "LA",
            },
          ],
        },
      },
      {
        ...minimalUserOrgData,
        Organisation: {
          associations: [
            {
              associated_organisation_id: "LA-2",
              link_type: "LA",
            },
          ],
        },
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    organisations.findAll.mockResolvedValue([]);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].organisation.localAuthority).toStrictEqual({
      id: userOrgData[0].Organisation.associations[0]
        .associated_organisation_id,
    });
    expect(result[1].organisation.localAuthority).toStrictEqual({
      id: userOrgData[1].Organisation.associations[0]
        .associated_organisation_id,
    });
  });

  it("Returns the user/organisation link's numeric/text identifiers if they are present", async () => {
    const userOrgData = [
      {
        ...minimalUserOrgData,
        numeric_identifier: 1,
        text_identifier: "a",
      },
      {
        ...minimalUserOrgData,
        numeric_identifier: 2,
        text_identifier: "b",
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].numericIdentifier).toStrictEqual(
      userOrgData[0].numeric_identifier,
    );
    expect(result[0].textIdentifier).toStrictEqual(
      userOrgData[0].text_identifier,
    );
    expect(result[1].numericIdentifier).toStrictEqual(
      userOrgData[1].numeric_identifier,
    );
    expect(result[1].textIdentifier).toStrictEqual(
      userOrgData[1].text_identifier,
    );
  });

  it("Returns the user/organisation link's numeric/text identifiers as undefined if they are not present", async () => {
    const userOrgData = [
      {
        ...minimalUserOrgData,
        numeric_identifier: null,
        text_identifier: null,
      },
      {
        ...minimalUserOrgData,
        numeric_identifier: null,
        text_identifier: null,
      },
    ];
    userOrganisations.findAll.mockResolvedValue(userOrgData);
    const result = await getOrganisationsAssociatedToUser("");

    expect(result[0].numericIdentifier).toStrictEqual(undefined);
    expect(result[0].textIdentifier).toStrictEqual(undefined);
    expect(result[1].numericIdentifier).toStrictEqual(undefined);
    expect(result[1].textIdentifier).toStrictEqual(undefined);
  });
});
