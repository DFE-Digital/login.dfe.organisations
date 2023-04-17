const { getOrgById } = require('./data/organisationsStorage');

const getOrganisation = async (req, res) => {
  const organisation = await getOrgById(req.params.id);
  if (!organisation) {
    return res.status(404).send();
  }
  return res.contentType('json').send({
    id: organisation.id,
    name: organisation.name,
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
    ProviderTypeName: organisation.ProviderTypeName,
  });
};

module.exports = getOrganisation;
