const { add, update, getOrgByUrn, getOrgByUid, getOrgByEstablishmentNumber, getOrgByUkprn, getOrgByLegacyId, getOrganisationCategories } = require('./data/organisationsStorage');
const uuid = require('uuid/v4');

const mapOrg = (req) => {
  return {
    name: req.body.name,
    category: {
      id: req.body.category.id,
    },
    type: req.body.type ? {
      id: req.body.type.id,
    } : undefined,
    urn: req.body.urn,
    uid: req.body.uid,
    ukprn: req.body.ukprn,
    establishmentNumber: req.body.establishmentNumber,
    status: {
      id: req.body.status ? req.body.status.id : 1,
    },
    closedOn: req.body.closedOn,
    address: req.body.address,
    telephone: req.body.telephone,
    region: req.body.region ? {
      id: req.body.region.id,
    } : undefined,
    phaseOfEducation: req.body.phaseOfEducation ? {
      id: req.body.phaseOfEducation.id,
    } : undefined,
    statutoryLowAge: req.body.statutoryLowAge,
    statutoryHighAge: req.body.statutoryHighAge,
    legacyId: req.body.legacyId,
  };
};
const validateOrg = async (organisation) => {
  if (!organisation.category || !organisation.category.id) {
    return 'Category is required';
  }

  const validCategories = await getOrganisationCategories();
  const validCategory = validCategories.find(x => x.id === organisation.category.id);
  if (!validCategory) {
    return `Unrecognised category ${organisation.category.id}`;
  }

  return null;
};
const getExistingOrg = async (organisation) => {
  let existing;

  if (!existing && organisation.legacyId) {
    existing = await getOrgByLegacyId(organisation.legacyId);
  }
  if (!existing && organisation.urn) {
    existing = await getOrgByUrn(organisation.urn);
  }
  if (!existing && organisation.uid) {
    existing = await getOrgByUid(organisation.uid);
  }
  if (!existing && organisation.category.id === '002' && organisation.establishmentNumber) {
    existing = await getOrgByEstablishmentNumber(organisation.establishmentNumber);
  }
  if (!existing && organisation.ukprn) {
    existing = await getOrgByUkprn(organisation.ukprn);
  }

  return existing;
};

const action = async (req, res) => {
  const organisation = mapOrg(req);

  const validationReason = await validateOrg(organisation);
  if (validationReason) {
    return res.status(400).send(validationReason);
  }

  const existingOrg = await getExistingOrg(organisation);
  if (existingOrg) {
    existingOrg.name = organisation.name;
    existingOrg.legacyId = organisation.legacyId;
    await update(existingOrg);

    return res.status(202).send();
  }

  organisation.id = uuid();
  await add(organisation);

  return res.status(201).send();
};

module.exports = action;
