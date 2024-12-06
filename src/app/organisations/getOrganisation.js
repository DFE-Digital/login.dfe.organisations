const { getOrgById } = require("./data/organisationsStorage");

const getOrganisation = async (req, res) => {
  const organisation = await getOrgById(req.params.id);
  if (!organisation) {
    return res.status(404).send();
  }
  return res.contentType("json").send({
    id: organisation.id,
    name: organisation.name,
    LegalName: organisation.LegalName,
    Category: organisation.category ? organisation.category.id : null,
    Type: organisation.type ? organisation.type.id : null,
    URN: organisation.urn,
    UID: organisation.uid,
    UPIN: organisation.upin,
    UKPRN: organisation.ukprn,
    EstablishmentNumber: organisation.establishmentNumber,
    Status: organisation.status ? organisation.status.id : null,
    ClosedOn: organisation.closedOn,
    Address: organisation.address,
    SourceSystem: organisation.SourceSystem,
    ProviderTypeName: organisation.providerTypeName,
    ProviderTypeCode: organisation.ProviderTypeCode,
    GIASProviderType: organisation.GIASProviderType,
    PIMSProviderType: organisation.PIMSProviderType,
    PIMSProviderTypeCode: organisation.PIMSProviderTypeCode,
    PIMSStatusName: organisation.PIMSStatusName,
    PIMSStatus: organisation.pimsStatus,
    GIASStatusName: organisation.GIASStatusName,
    GIASStatus: organisation.GIASStatus,
    MasterProviderStatusName: organisation.MasterProviderStatusName,
    MasterProviderStatusCode: organisation.MasterProviderStatusCode,
    OpenedOn: organisation.OpenedOn,
    DistrictAdministrativeName: organisation.DistrictAdministrativeName,
    DistrictAdministrativeCode: organisation.DistrictAdministrativeCode,
    DistrictAdministrative_code: organisation.DistrictAdministrative_code,
    IsOnAPAR: organisation.IsOnAPAR,
  });
};

module.exports = getOrganisation;
