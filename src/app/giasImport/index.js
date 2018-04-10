const { parse } = require('./establishmentCsvReader');
const { list, add, update } = require('./../organisations/data/organisationsStorage');
const uuid = require('uuid/v4');

const mapImportRecordForStorage = (importing) => {
  return {
    id: uuid(),
    name: importing.name,
    category: {
      id: '001',
    },
    type: importing.type,
    urn: importing.urn,
    uid: null,
    ukprn: importing.ukprn,
    establishmentNumber: importing.establishmentNumber,
    status: {
      id: importing.status,
    },
    closedOn: importing.closedOn,
  }
};
const addEstablishment = async (importing) => {
  await add(mapImportRecordForStorage(importing));
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
  if (hasBeenUpdated(updated.name, existing.name) || hasBeenUpdated(updated.category.id, existing.category.id)
    || hasBeenUpdated(updated.type, existing.type) || hasBeenUpdated(updated.ukprn, existing.ukprn) || hasBeenUpdated(updated.establishmentNumber, existing.establishmentNumber)
    || hasBeenUpdated(updated.status.id, existing.status.id) || hasBeenUpdated(updated.closedOn, existing.closedOn)) {
    updated.id = existing.id;
    await update(updated);
  }
};
const addOrUpdateEstablishments = async (importingEstablishments, existingEstablishments) => {
  for (let i = 0; i < importingEstablishments.length; i += 1) {
    const importing = importingEstablishments[i];
    const existing = existingEstablishments.find(e => e.urn === importing.urn);
    if (existing) {
      await updateEstablishment(importing, existing);
    } else {
      await addEstablishment(importing);
    }
  }
};

const importEstablishments = async (data) => {
  const importingEstablishments = await parse(data);
  const existingEstablishments = await list(data);

  await addOrUpdateEstablishments(importingEstablishments, existingEstablishments);

  // TODO: Handle establishments that are no longer in feed
};

module.exports = {
  importEstablishments,
};
