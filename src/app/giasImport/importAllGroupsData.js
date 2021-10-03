const moment = require('moment');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config')();
const { getGroupsFile } = require('./../../infrastructure/gias');
const { parse: parseGroups } = require('./groupCsvReader');
const { parse: parseGroupLinks } = require('./groupLinksCsvReader');
const {
  add, update, pagedListOfCategory, addAssociation,
  removeAssociationsOfType,
  getNextOrganisationLegacyId,
  getUserOrganisationByOrgId,
  deleteOrganisation
} = require('./../organisations/data/organisationsStorage');
const uuid = require('uuid/v4');
const rp = require('request-promise');

const isGroupImportable = (group) => {
  const importableTypes = [
    '06', // MAT
    '10', // SAT
  ];
  if (!importableTypes.find(x => x === group.type)) {
    return false;
  }

  const importableStatuses = ['OPEN', 'CLOSED', 'PROPOSED_TO_OPEN', 'CREATED_IN_ERROR'];
  if (!importableStatuses.find(x => x === group.status)) {
    return false;
  }

  return true;
};

const mapImportRecordForStorage = (importing) => {
  const address = importing.address.filter(x => x !== null).join(', ');

  let status;
  switch (importing.status) {
    case 'OPEN':
      status = {
        id: 1,
      };
      break;
    case 'CLOSED':
      status = {
        id: 2,
      };
      break;
    case 'PROPOSED_TO_OPEN':
      status = {
        id: 4,
      };
      break;
    case "CREATED_IN_ERROR":
      status = {
        id: 9,
      };
      break;
    default:
      status = null;
      break;
  }

  let category;
  if (importing.type === '06') {
    category = { id: '010', name: 'Multi-Academy Trust' };
  } else if (importing.type === '10') {
    category = { id: '013', name: 'Single-Academy Trust' };
  }

  return {
    id: uuid(),
    name: importing.name,
    category,
    type: null,
    urn: null,
    uid: importing.uid,
    ukprn: importing.ukprn,
    establishmentNumber: null,
    status,
    closedOn: importing.closedOn,
    address,
    companyRegistrationNumber: importing.companyRegistrationNumber,
    legacyId: importing.legacyId,
  };
};

const generateLegacyId = async () => {
  if (!config.toggles || !config.toggles.generateOrganisationLegacyId) {
    return undefined;
  }
  return await getNextOrganisationLegacyId();
};

const addGroup = async (importing) => {
  const organisation = mapImportRecordForStorage(importing);
  await add(organisation);
  logger.info(`Added group ${importing.uid}`);
  return organisation.id;
};
const hasBeenUpdated = (newValue, oldValue) => {
  if ((newValue && !oldValue) || (!newValue && oldValue)) {
    return true;
  }

  if (newValue instanceof Date) {
    if (oldValue instanceof Date) {
      const nValue = newValue.getTime();
      const oValue = oldValue.getTime();
      return nValue !== oValue;
    } else if (typeof oldValue === 'string') {
      const nDate = newValue.toISOString().split('T')[0];
      return oldValue !== nDate;
    }
  }

  if (newValue instanceof Object && Object.keys(newValue).find(x => x === 'id')) {
    return hasBeenUpdated(newValue.id, oldValue.id);
  }

  return newValue !== oldValue;
};
const updateGroup = async (importing, existing) => {
  const updated = mapImportRecordForStorage(importing);
  updated.id = existing.id;

  if (hasBeenUpdated(updated.name, existing.name) || hasBeenUpdated(updated.category, existing.category)
    || hasBeenUpdated(updated.status, existing.status) || hasBeenUpdated(updated.closedOn, existing.closedOn)
    || hasBeenUpdated(updated.address, existing.address) || hasBeenUpdated(updated.companyRegistrationNumber, existing.companyRegistrationNumber)
    || hasBeenUpdated(updated.ukprn, existing.ukprn)) {
    await update(updated);
    logger.info(`Updated group ${importing.uid}`);
  } else {
    logger.info(`Skipped group ${importing.uid} as it has not changed`);
  }

  return updated.id;
};

const linkAcademies = async (importing, existing, importingGroupLinks, existingEstablishments, organisationId) => {
  const importingLinks = importingGroupLinks.filter(x => x.uid === importing.uid);
  const links = importingLinks.map((link) => {
    const establishment = existingEstablishments.find(x => x.urn === link.urn);
    if (!establishment) {
      return null;
    }
    return {
      organisationId,
      associatedOrganisationId: establishment.id,
      linkType: 'ACADEMY',
    };
  }).filter(x => x !== null);

  await removeAssociationsOfType(organisationId, 'ACADEMY');
  for (let i = 0; i < links.length; i += 1) {
    const importingLink = links[i];
    await addAssociation(importingLink.organisationId, importingLink.associatedOrganisationId, importingLink.linkType);
  }
};

const updateOrDeleteGroup = async (importing, existing) => {
  let result = {};

  const organisationId = await updateGroup(importing, existing);
  result["organisationId"] = organisationId;
  result["crud"] = 'update';

  const userExists = await getUserOrganisationByOrgId(existing.id);

  if (!userExists && isRestrictedStatus(importing)) {
    result = await deleteGroup(existing);
    if (result.saved) {
      result["crud"] = 'delete';
    }
  }

  return result;
}

const isRestrictedStatus = (importing) => {
  const RestrictedStatuses = ['CREATED_IN_ERROR'];

  if (RestrictedStatuses.find(s => s === importing.status)) {
    return true;
  }

  return false;
};

const deleteGroup = async (existing) => {
  let orgUpdated = false;

  try {
    await deleteOrganisation(existing.id)
    orgUpdated = true;
    logger.info(`Deleted Group ${existing.uid}`);
  } catch (e) {
    logger.warn(`Error deleting Group ${existing.uid} - ${e.message}`);
  }

  return {
    organisationId: existing.id,
    saved: orgUpdated,
  };
};

const addOrUpdateGroups = async (importingGroups, importingGroupLinks, existingGroups, existingEstablishments) => {
  for (let i = 0; i < importingGroups.length; i += 1) {
    const importing = importingGroups[i];
    if (isGroupImportable(importing)) {
      const existing = existingGroups.find(e => e.uid === importing.uid);
      const isRestricted = isRestrictedStatus(importing);

      let result = {};
      if (existing) {
        result = await updateOrDeleteGroup(importing, existing);
      } else if (!isRestricted) {
        importing.legacyId = await generateLegacyId();
        result['organisationId'] = await addGroup(importing);
      }

      if (!result.hasOwnProperty('organisationId') || !result['organisationId']) {
        logger.info(`Not importing group ${importing.uid} as it does meet importable criteria`);
        return
      }

      if (result.hasOwnProperty('crud') && result.crud.toLowerCase() == 'delete') {
        return;
      }

      await linkAcademies(importing, existing, importingGroupLinks, existingEstablishments, result['organisationId']);
    } else {
      logger.info(`Not importing group ${importing.uid} as it does meet importable criteria`);
    }
  }
};

const listOfCategory = async (category, includeAssociations = false) => {
  const allOrgs = [];
  let pageNumber = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    const page = await pagedListOfCategory(category, includeAssociations, pageNumber, 500);
    allOrgs.push(...page.organisations);

    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber += 1;
  }
  return allOrgs;
};

const getAllGroupsDataFile = async () => {
  // Try to get today's file if you can't find it then read yesterday's file.
  const today = moment().format('YYYYMMDD');
  try {
    return await getAllGroupsDataFileForDate(today);
  } catch (e) {
    logger.info('Could not find today\'s file');
  }

  const yesterday = moment().subtract(1, 'days').format('YYYYMMDD');
  return await getAllGroupsDataFileForDate(yesterday);
};

const getAllGroupsDataFileForDate = async (date) => {
  const uri = `${config.gias.allGroupsDataUrl}`.replace('#date#', date);
  logger.info(`Reading the allGroupsDataUrl ${uri}`);

  return await rp({
    method: 'GET',
    uri,
    json: false,
  });
};

const importAllGroupsData = async () => {
  logger.debug('Getting all group data');
  const groupData = await getGroupsFile(true);
  const getAllGroupsDataFromFile = await getAllGroupsDataFile();
  logger.debug('Parsing all group data');
  const importingGroups = await parseGroups(getAllGroupsDataFromFile);
  logger.debug('Parsing group links');
  const importingGroupLinks = await parseGroupLinks(groupData.links);
  logger.debug('Getting existing groups');

  const existingMATs = await listOfCategory('010', true);
  const existingSATs = await listOfCategory('013', true);
  const existingGroups = existingMATs.concat(existingSATs);

  logger.debug('Getting existing establishments');
  const existingEstablishments = await listOfCategory('001', true);
  await addOrUpdateGroups(importingGroups, importingGroupLinks, existingGroups, existingEstablishments);
};



module.exports = importAllGroupsData;
