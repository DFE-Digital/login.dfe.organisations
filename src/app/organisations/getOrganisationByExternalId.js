const { getOrgByUrn, getOrgByUid, getOrgByEstablishmentNumber, getOrgByLegacyId, getOrgByUpin, getOrgByUkprn, getAllOrgsByUkprn, getAllOrgsByUpin, getAllOrgsByIsOnAPAR } = require('./data/organisationsStorage');

const getOrganisationByExternalIdentifier = async (req, res) => {
  if (!req.params.id || !req.params.type) {
    return res.status(403).send();
  }


  let result;
  if (req.params.type === '000') {
    result = await getOrgByLegacyId(req.params.id);
  } else if (req.params.type === 'UKPRN') {
    result = await getOrgByUkprn(req.params.id);
  } else if (req.params.type === 'UKPRN-multi') {
    // returns an array, as we might have more than one org with same UKPRN
    result = await getAllOrgsByUkprn(req.params.id);
  } else if (req.params.type === '010' || req.params.type === '013') {
    result = await getOrgByUid(req.params.id);
  } else if (req.params.type === 'UPIN') {
    result = await getOrgByUpin(req.params.id);
  } else if (req.params.type === 'UPIN-multi') {
    result = await getAllOrgsByUpin(req.params.id);
  } else if (req.params.type === 'IsOnAPAR') {
    result = await getAllOrgsByIsOnAPAR(req.params.id);
  } else if (req.params.type === '001') {
    result = await getOrgByUrn(req.params.id);
  } else if (req.params.type === '002') {
    result = await getOrgByEstablishmentNumber(req.params.id);
  }
  if (result) {
    return res.contentType('json').send(result);
  }
  return res.status(404).send();
};

module.exports = getOrganisationByExternalIdentifier;
