const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config')();
const { parse } = require('./establishmentCsvReader');
const { getNextOrganisationLegacyId, list, add, update, pagedListOfCategory, addAssociation, removeAssociationsOfType } = require('./../organisations/data/organisationsStorage');
const { raiseNotificationThatOrganisationHasChanged } = require('./../organisations/notifications');
const { getEstablishmentsFile } = require('./../../infrastructure/gias');
const uuid = require('uuid/v4');
const uniqBy = require('lodash/uniqBy');

const isEstablishmentImportable = (importing) => {
  const importableTypes = ['01', '02', '03', '05', '06', '07', '08', '10', '11', '12', '14', '15', '18', '24', '25', '26', '28', '29', '30', '32', '33', '34', '35', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
  const importableStatuses = [1, 2, 3, 4];

  if (!importing.urn) {
    return false;
  }

  if (!importableTypes.find(t => t === importing.type)) {
    return false;
  }

  if (!importableStatuses.find(s => s === importing.status)) {
    return false;
  }

  return true;
};
const mapImportRecordForStorage = async (importing) => {
  const address = [
    importing.address1,
    importing.address2,
    importing.address3,
    importing.town,
    importing.county,
    importing.postcode,
  ].filter(x => x !== undefined && x !== null && x.trim().length > 0).join(', ');
  return {
    id: uuid(),
    name: importing.name,
    category: {
      id: '001',
    },
    type: {
      id: importing.type,
    },
    urn: importing.urn,
    uid: null,
    ukprn: importing.ukprn,
    establishmentNumber: importing.establishmentNumber,
    status: {
      id: importing.status,
    },
    closedOn: importing.closedOn,
    address,
    telephone: importing.telephone,
    region: {
      id: importing.regionCode,
    },
    phaseOfEducation: {
      id: importing.phaseOfEducation,
    },
    statutoryLowAge: importing.statutoryLowAge,
    statutoryHighAge: importing.statutoryHighAge,
    legacyId: importing.legacyId,
  };
};
const generateLegacyId = async () => {
  if (!config.toggles || !config.toggles.generateOrganisationLegacyId) {
    return undefined;
  }
  return await getNextOrganisationLegacyId();
};

const addEstablishment = async (importing) => {
  try {
    const organisation = await mapImportRecordForStorage(importing);
    await add(organisation);
    logger.info(`Added establishment ${organisation.urn}`);
    await raiseNotificationThatOrganisationHasChanged(organisation.id);
    logger.info(`Notified addition of establishment ${organisation.urn}`);
    return organisation.id;
  } catch (e) {
    throw new Error(`Error adding establishment ${importing.urn} - ${e.message}`);
  }
};
const hasBeenUpdated = (updated, existing) => {
  if ((updated && !existing) || (!updated && existing)) {
    return true;
  }

  if (updated instanceof Date) {
    const utime = updated.getTime();
    const etime = existing.getTime();
    return utime !== etime;
  }

  if (updated instanceof Object && Object.keys(updated).find(x => x === 'id')) {
    return hasBeenUpdated(updated.id, existing.id);
  }

  return updated !== existing;
};
const updateEstablishment = async (importing, existing) => {
  const updated = await mapImportRecordForStorage(importing);
  updated.id = existing.id;

  if (hasBeenUpdated(updated.name, existing.name) || hasBeenUpdated(updated.category, existing.category)
    || hasBeenUpdated(updated.type, existing.type) || hasBeenUpdated(updated.ukprn, existing.ukprn) || hasBeenUpdated(updated.establishmentNumber, existing.establishmentNumber)
    || hasBeenUpdated(updated.status.id, existing.status.id) || hasBeenUpdated(updated.closedOn, existing.closedOn) || hasBeenUpdated(updated.address, existing.address)
    || hasBeenUpdated(updated.telephone, existing.telephone) || hasBeenUpdated(updated.region, existing.region) || hasBeenUpdated(updated.phaseOfEducation, existing.phaseOfEducation)
    || hasBeenUpdated(updated.statutoryLowAge, existing.statutoryLowAge) || hasBeenUpdated(updated.statutoryHighAge, existing.statutoryHighAge)) {
    try {
      await update(updated);
      logger.info(`Updated establishment ${importing.urn}`);
      await raiseNotificationThatOrganisationHasChanged(updated.id);
      logger.info(`Notified update of establishment ${importing.urn}`);
    } catch (e) {
      logger.info(`Error updating establishment ${importing.urn} - ${e.message}`);
    }
  } else {
    logger.info(`Skipped establishment ${importing.urn} as it has not changed`);
  }

  return updated.id;
};
const addOrUpdateEstablishments = async (importingEstablishments, existingEstablishments, localAuthorities) => {
  for (let i = 0; i < importingEstablishments.length; i += 1) {
    const importing = importingEstablishments[i];
    if (isEstablishmentImportable(importing)) {
      const existing = existingEstablishments.find(e => e.urn && e.urn.toString().toLowerCase().trim() === importing.urn.toString().toLowerCase().trim());

      let organisationId;
      if (existing) {
        organisationId = await updateEstablishment(importing, existing);
      } else {
        importing.legacyId = await generateLegacyId();
        organisationId = await addEstablishment(importing);
      }

      const localAuthority = localAuthorities.find(la => la.establishmentNumber === importing.laCode);
      const existingLAAssociation = existing && existing.associations ? existing.associations.find(a => a.associationType === 'LA') : undefined;
      if (localAuthority && (!existingLAAssociation || existingLAAssociation.associatedOrganisationId.toLowerCase() !== localAuthority.id.toLowerCase())) {
        await removeAssociationsOfType(organisationId, 'LA');
        await addAssociation(organisationId, localAuthority.id, 'LA');
        logger.info(`Updated LA link for establishment ${importing.urn}`);
      } else if (!localAuthority && existingLAAssociation) {
        await removeAssociationsOfType(organisationId, 'LA');
        logger.info(`Removed LA link for establishment ${importing.urn}`);
      }
    } else {
      logger.info(`Not importing establishment ${importing.urn} as it does meet importable criteria`);
    }
  }
};

const isLocalAuthorityImportable = (importing) => {
  if (!importing.code || !importing.name) {
    return false;
  }
  return true;
};
const mapImportLocalAuthorityForStorage = (importing) => {
  return {
    id: uuid(),
    name: importing.name,
    category: {
      id: '002',
    },
    type: null,
    urn: null,
    uid: null,
    ukprn: null,
    establishmentNumber: importing.code,
    status: {
      id: 1,
    },
    closedOn: null,
    address: null,
    telephone: null,
    region: null,
    phaseOfEducation: null,
    statutoryLowAge: null,
    statutoryHighAge: null,
  };
};
const addLocalAuthority = async (importing) => {
  try {
    const organisation = mapImportLocalAuthorityForStorage(importing);
    await add(organisation);
    logger.info(`Added local authority ${importing.code} - ${importing.name}`);
    await raiseNotificationThatOrganisationHasChanged(update.id);
    logger.info(`Notified addition of local authority ${importing.code} - ${importing.name}`);
    return organisation.id;
  } catch (e) {
    logger.info(`Error adding local authority ${importing.code} - ${importing.name} - ${e.message}`);
  }
};
const updateLocalAuthority = async (importing, existing) => {
  try {
    const organisation = mapImportLocalAuthorityForStorage(importing);
    organisation.id = existing.id;
    await update(organisation);
    logger.info(`Updated local authority ${importing.code} - ${importing.name}`);
    await raiseNotificationThatOrganisationHasChanged(organisation.id);
    logger.info(`Notified update of local authority ${importing.code} - ${importing.name}`);
  } catch (e) {
    logger.info(`Error updating local authority ${importing.code} - ${importing.name} - ${e.message}`);
  }
};
const addOrUpdateLocalAuthorities = async (importingEstablishments, localAuthorities) => {
  const importingLocalAuthorities = uniqBy(importingEstablishments.map(e => ({
    code: e.laCode,
    name: e.laName,
  })), 'code');
  let updated = false;

  for (let i = 0; i < importingLocalAuthorities.length; i += 1) {
    const importing = importingLocalAuthorities[i];
    if (isLocalAuthorityImportable(importing)) {
      const existing = localAuthorities.find(la => la.establishmentNumber === importing.code);

      if (!existing) {
        await addLocalAuthority(importing);
        updated = true;
      } else if (importing.name !== existing.name) {
        await updateLocalAuthority(importing, existing);
        updated = true;
      }
    }
  }

  return updated;
};

const listOfCategory = async (category, includeAssociations = false) => {
  const allOrgs = [];
  let pageNumber = 1;
  let hasMorePages = true;
  let expected = 0;
  while (hasMorePages) {
    const page = await pagedListOfCategory(category, includeAssociations, pageNumber, 500);
    allOrgs.push(...page.organisations);

    expected = page.totalNumberOfRecords;
    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber += 1;
  }
  if (allOrgs.length !== expected) {
    throw new Error(`Expected ${expected} organisations of category ${category} but only received ${allOrgs.length}`);
  }
  return allOrgs;
};

const importEstablishmentsAndLocalAuthorities = async () => {
  logger.debug('Getting establishment data');
  const data = await getEstablishmentsFile();

  logger.debug('Parsing establishment data');
  const importingEstablishments = await parse(data.establishments);

  logger.debug('Getting existing establishments');
  const existingEstablishments = await listOfCategory('001', true);

  logger.debug('Getting local authorities');
  let localAuthorities = await listOfCategory('002');

  const localAuthoritiesUpdated = await addOrUpdateLocalAuthorities(importingEstablishments, localAuthorities);
  if (localAuthoritiesUpdated) {
    logger.debug('Re-getting local authorities after updates');
    localAuthorities = await listOfCategory('002');
  }

  await addOrUpdateEstablishments(importingEstablishments, existingEstablishments, localAuthorities);

  // TODO: Handle establishments that are no longer in feed
};

module.exports = importEstablishmentsAndLocalAuthorities;
