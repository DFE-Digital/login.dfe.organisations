const logger = require('./../../infrastructure/logger');
const { parse } = require('./establishmentCsvReader');
const { list, add, update, listOfCategory, addAssociation, removeAssociationsOfType } = require('./../organisations/data/organisationsStorage');
const { getEstablishmentsFile } = require('./../../infrastructure/gias');
const uuid = require('uuid/v4');
const uniqBy = require('lodash/uniqBy');

const isEstablishmentImportable = (importing) => {
  const importableTypes = ['01', '02', '03', '05', '06', '07', '08', '10', '11', '12', '14', '15', '18', '24', '25', '26', '28', '30', '32', '33', '34', '35', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
  const importableStatuses = [1, 2, 3, 4];

  if (!importableTypes.find(t => t === importing.type)) {
    return false;
  }

  if (!importableStatuses.find(s => s === importing.status)) {
    return false;
  }

  return true;
};
const mapImportRecordForStorage = (importing) => {
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
  };
};
const addEstablishment = async (importing) => {
  const organisation = mapImportRecordForStorage(importing);
  await add(organisation);
  logger.info(`Added establishment ${importing.urn}`);
  return organisation.id;
};
const hasBeenUpdated = (newValue, oldValue) => {
  if ((newValue && !oldValue) || (!newValue && oldValue)) {
    return true;
  }

  if (newValue instanceof Date) {
    return newValue.getTime() !== oldValue.getTime();
  }

  return newValue !== oldValue;
};
const updateEstablishment = async (importing, existing) => {
  const updated = mapImportRecordForStorage(importing);
  updated.id = existing.id;

  if (hasBeenUpdated(updated.name, existing.name) || hasBeenUpdated(updated.category.id, existing.category.id)
    || hasBeenUpdated(updated.type.id, existing.type.id) || hasBeenUpdated(updated.ukprn, existing.ukprn) || hasBeenUpdated(updated.establishmentNumber, existing.establishmentNumber)
    || hasBeenUpdated(updated.status.id, existing.status.id) || hasBeenUpdated(updated.closedOn, existing.closedOn) || hasBeenUpdated(updated.address, existing.address)) {
    await update(updated);
    logger.info(`Updated establishment ${importing.urn}`);
  } else {
    logger.info(`Skipped establishment ${importing.urn} as it has not changed`);
  }

  return updated.id;
};
const addOrUpdateEstablishments = async (importingEstablishments, existingEstablishments, localAuthorities) => {
  for (let i = 0; i < importingEstablishments.length; i += 1) {
    const importing = importingEstablishments[i];
    if (isEstablishmentImportable(importing)) {
      const existing = existingEstablishments.find(e => e.urn === importing.urn);

      let organisationId;
      if (existing) {
        organisationId = await updateEstablishment(importing, existing);
      } else {
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
  };
};
const addLocalAuthority = async (importing) => {
  const organisation = mapImportLocalAuthorityForStorage(importing);
  await add(organisation);
  logger.info(`Added local authority ${importing.code} - ${importing.name}`);
  return organisation.id;
};
const updateLocalAuthority = async (importing, existing) => {
  const organisation = mapImportLocalAuthorityForStorage(importing);
  organisation.id = existing.id;
  await update(organisation);
  logger.info(`Updated local authority ${importing.code} - ${importing.name}`);
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
