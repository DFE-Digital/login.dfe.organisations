jest.mock("./../../../src/app/organisations/data/organisationsStorage", () => {
  return {
    getOrgById: jest.fn(),
  };
});

const httpMocks = require("node-mocks-http");
const {
  getOrgById,
} = require("./../../../src/app/organisations/data/organisationsStorage");
const getOrganisation = require("./../../../src/app/organisations/getOrganisation");

describe("when getting an organisation by id", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id: "org-1",
      },
    };

    res = httpMocks.createResponse();

    getOrgById.mockReset();
  });

  it("it should return 404 if organisation not found", async () => {
    await getOrganisation(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it("it should return json for organisation if found", async () => {
    const org = {
      id: "8B2A7DBA-BFD9-440F-9A14-03E94DDA4ED6",
      name: "? N?S ENTERTAINMENT LIMITED",
      category: {
        id: "013",
      },
      type: null,
      urn: null,
      uid: "16840",
      ukprn: null,
      establishmentNumber: null,
      status: {
        id: 1,
      },
      closedOn: null,
      address: "Not recorded",
    };
    getOrgById.mockReturnValue(org);

    await getOrganisation(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toEqual({
      id: org.id,
      name: org.name,
      Category: org.category.id,
      Type: null,
      URN: null,
      UID: org.uid,
      UKPRN: null,
      EstablishmentNumber: null,
      Status: org.status.id,
      ClosedOn: null,
      Address: org.address,
    });
    expect(res._isEndCalled()).toBe(true);
  });
});
