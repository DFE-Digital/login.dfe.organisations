jest.mock(
  "./../../../src/infrastructure/config",
  () => () => require("../../utils").mockConfig(),
);

jest.mock("../../../src/app/organisations/data/organisationsStorage", () => ({
  updateOtherStakeholders: jest.fn(),
}));

const editOrganisation = require("./../../../src/app/organisations/editOrganisation");
const {
  updateOtherStakeholders,
} = require("./../../../src/app/organisations/data/organisationsStorage");

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

describe("when editing an other stakeholders organisation", () => {
  let req;

  beforeEach(() => {
    req = httpMocks.createRequest({
      body: {
        name: "Test org 999",
        address: "Test org 999 address",
      },
      params: {
        id: "102030405",
      },
    });

    res.mockResetAll();
  });

  test("should call updateOtherStakeholders with the required field", async () => {
    await editOrganisation(req, res);

    const orgUpdate = {
      id: req.params.id,
      name: req.body.name,
      address: req.body.address,
    };

    expect(updateOtherStakeholders).toHaveBeenCalledWith(orgUpdate);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
