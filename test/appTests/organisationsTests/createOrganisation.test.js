jest.mock(
  "./../../../src/infrastructure/config",
  () => () => require("../../utils").mockConfig(),
);

jest.mock("../../../src/app/organisations/data/organisationsStorage", () => ({
  add: jest.fn(),
  update: jest.fn(),
  getOrgByUrn: jest.fn(),
  getOrgByUid: jest.fn(),
  getOrgByEstablishmentNumber: jest.fn(),
  getOrgByUkprn: jest.fn(),
  getOrgByLegacyId: jest.fn(),
  getOrganisationCategories: jest.fn(),
  getNextOrganisationLegacyId: jest.fn(),
}));
jest.mock("./../../../src/app/organisations/notifications");

const {
  createOrganisation,
  validateOrg,
  getExistingOrg,
} = require("./../../../src/app/organisations/createOrganisation");
const organisationStorage = require("./../../../src/app/organisations/data/organisationsStorage");
const notifications = require("./../../../src/app/organisations/notifications");
const httpMocks = require("node-mocks-http");

const res = {
  json: jest.fn(),
  status: jest.fn(),
  send: jest.fn(),
  mockResetAll: function () {
    this.json.mockReset().mockReturnValue(this);
    this.status.mockReset().mockReturnValue(this);
    this.send.mockReset().mockReturnValue(this);
  },
};

describe("when creating a new organisation", () => {
  let req;

  beforeEach(() => {
    req = httpMocks.createRequest({
      body: {
        name: "Test org 999",
        address: "Test org 999 address",
        category: { id: "008" },
      },
    });

    res.mockResetAll();

    organisationStorage.getOrganisationCategories.mockReset().mockReturnValue([
      { id: "008", name: "Other Stakeholders" },
      { id: "002", name: "Establishment" },
    ]);

    organisationStorage.getNextOrganisationLegacyId
      .mockReset()
      .mockReturnValue("738401");

    organisationStorage.getOrgByUrn.mockReset().mockReturnValue({
      name: "Test org 111",
      address: "Test org 111 address",
      category: { id: "008" },
      urn: "4321",
    });

    organisationStorage.getOrgByLegacyId.mockReset().mockReturnValue({
      name: "Test org 111",
      address: "Test org 111 address",
      category: { id: "008" },
      legacyId: "1234",
    });

    organisationStorage.getOrgByUrn.mockReset().mockReturnValue({
      name: "Test org 111",
      address: "Test org 111 address",
      category: { id: "008" },
      urn: "4321",
    });

    organisationStorage.getOrgByUid.mockReset().mockReturnValue({
      name: "Test org 111",
      address: "Test org 111 address",
      category: { id: "008" },
      uid: "2025",
    });

    organisationStorage.getOrgByUkprn.mockReset().mockReturnValue({
      name: "Test org 111",
      address: "Test org 111 address",
      category: { id: "008" },
      ukprn: "12345678",
    });

    organisationStorage.getOrgByEstablishmentNumber
      .mockReset()
      .mockReturnValue({
        name: "Test org 111",
        address: "Test org 111 address",
        category: { id: "002" },
        establishmentNumber: "212121",
      });
  });

  test("should add a new organisation if none exists and generate a new legacyId", async () => {
    await createOrganisation(req, res);

    expect(organisationStorage.add).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(
      notifications.raiseNotificationThatOrganisationHasChanged,
    ).toHaveBeenCalled();
  });

  test("should update an existing organisation if has a legacyId", async () => {
    req.body.legacyId = "1234";

    await createOrganisation(req, res);

    expect(organisationStorage.update).toHaveBeenCalledWith({
      name: "Test org 999",
      address: "Test org 111 address",
      category: { id: "008" },
      legacyId: "1234",
    });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(
      notifications.raiseNotificationThatOrganisationHasChanged,
    ).toHaveBeenCalled();
  });

  test("should update an existing organisation if has a URN", async () => {
    req.body.urn = "4321";

    await createOrganisation(req, res);

    expect(organisationStorage.update).toHaveBeenCalledWith({
      name: "Test org 999",
      address: "Test org 111 address",
      category: { id: "008" },
      urn: "4321",
    });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(
      notifications.raiseNotificationThatOrganisationHasChanged,
    ).toHaveBeenCalled();
  });

  test("should update an existing organisation if has a UID", async () => {
    req.body.uid = "2025";

    await createOrganisation(req, res);

    expect(organisationStorage.update).toHaveBeenCalledWith({
      name: "Test org 999",
      address: "Test org 111 address",
      category: { id: "008" },
      uid: "2025",
    });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(
      notifications.raiseNotificationThatOrganisationHasChanged,
    ).toHaveBeenCalled();
  });

  test("should update an existing organisation if it has a UKPRN", async () => {
    req.body.ukprn = "12345678";

    await createOrganisation(req, res);

    expect(organisationStorage.update).toHaveBeenCalledWith({
      name: "Test org 999",
      address: "Test org 111 address",
      category: { id: "008" },
      ukprn: "12345678",
    });

    expect(res.status).toHaveBeenCalledWith(202);
    expect(
      notifications.raiseNotificationThatOrganisationHasChanged,
    ).toHaveBeenCalled();
  });

  test("should return 400 if no organisation category is selected", async () => {
    req.body.category = { id: "" };

    await createOrganisation(req, res);
    const validateOrgResult = await validateOrg(req.body);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(validateOrgResult).toBe("Category is required");
  });

  test("should return 400 if organisation category does not exist", async () => {
    req.body.category = { id: "321" };

    await createOrganisation(req, res);
    const validateOrgResult = await validateOrg(req.body);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(validateOrgResult).toBe("Unrecognised category 321");
  });

  test("should update establishment organisation if category 002 is selected and establishmentNumber provided", async () => {
    req.body.category = { id: "002" };
    req.body.establishmentNumber = "212121";

    await createOrganisation(req, res);
    const getExistingOrgResult = await getExistingOrg(req.body);

    expect(organisationStorage.update).toHaveBeenCalledWith({
      name: "Test org 999",
      address: "Test org 111 address",
      category: { id: "002" },
      establishmentNumber: "212121",
      legacyId: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(202);
    expect(getExistingOrgResult).toStrictEqual({
      address: "Test org 111 address",
      category: { id: "002" },
      establishmentNumber: "212121",
      legacyId: undefined,
      name: "Test org 999",
    });
  });
});
