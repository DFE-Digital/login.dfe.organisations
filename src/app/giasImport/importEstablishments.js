const logger = require('./../../infrastructure/logger');
const { parse } = require('./establishmentCsvReader');
const { list, add, update, listOfCategory, addAssociation, removeAssociationsOfType } = require('./../organisations/data/organisationsStorage');
const { getEstablishmentsFile } = require('./../../infrastructure/gias');
const uuid = require('uuid/v4');

const isEstablishmentImportable = (importing) => {
  const importableTypes = ['01', '02', '03', '05', '06', '07', '08', '10', '11', '12', '14', '15', '18', '24', '25', '26', '28', '30', '32', '33', '34', '35', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

  if (!importableTypes.find(t => t === importing.type)) {
    return false;
  }

  return true;
};
const mapImportRecordForStorage = (importing) => {
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
    address: importing.address,
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
      const existingLAAssociation = existing.associations.find(a => a.associationType === 'LA');
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

const importEstablishments = async () => {
  logger.debug('Getting establishment data');
  const data = await getEstablishmentsFile();

  logger.debug('Parsing establishment data');
  const importingEstablishments = await parse(data);

  logger.debug('Getting existing establishments');
  const existingEstablishments = await list(true); //TODO: Filter to establishments only

  logger.debug('Getting local authorities');
  const localAuthorities = await listOfCategory('002');

  await addOrUpdateEstablishments(importingEstablishments, existingEstablishments, localAuthorities);

  // TODO: Handle establishments that are no longer in feed
};

module.exports = importEstablishments;
