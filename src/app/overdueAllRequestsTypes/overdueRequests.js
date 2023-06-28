const NotificationClient = require('login.dfe.notifications.client');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config')();
const { getUsersByIds } = require('./../../infrastructure/directories');
const { pagedListOfRequests, updateUserOrgRequest, getApproversForOrg, pagedListOfServSubServRequests, updateUserServSubServRequest, getAllPendingRequestTypesForApprover } = require('./../organisations/data/organisationsStorage');
const moment = require('moment');

const {
  requestTypes,
  actionedReasons
} = require('./constants');

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString
});

const listRequests = async(pageSize, statuses, requestType) => {
  const allRequests = [];
  let pageNumber = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    let page;
    if (requestType === requestTypes.ORGANISATION_ACCESS) {
      page = await pagedListOfRequests(pageNumber, pageSize, statuses);
    } else if (requestType === requestTypes.SERVICE_SUB_SERVICE_ACCESS) {
      page = await pagedListOfServSubServRequests(pageNumber, pageSize, statuses);
    }
    allRequests.push(...page.requests);

    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber += 1;
  }
  return allRequests;
};

const listApproversReqToOverdue = async(userId, pageSize, filterDateStart, filterDateEnd) => {
  const result = await getAllPendingRequestTypesForApprover(userId, 1, pageSize, filterDateStart, filterDateEnd);
  return result.totalNumberOfRecords;
};

const overdueRequests = async(outstandingRequests, requestType, orgIdsByRequestCount, dateNow, numberOfDaysUntilOverdue, actionedReason = undefined) => {
  for (let i = 0; i < outstandingRequests.length; i += 1) {
    const request = outstandingRequests[i];

    const differenceInDays = dateNow.clone().diff(request.created_date, 'days') + 1;

    if (differenceInDays >= numberOfDaysUntilOverdue) {
      // update request as overdue
      let updatedRequest;
      if (actionedReason) {
        updatedRequest = {
          status: 2,
          actioned_reason: actionedReason
        };
      } else {
        updatedRequest = { status: 2 };
      }

      if (requestType === requestTypes.ORGANISATION_ACCESS) {
        await updateUserOrgRequest(request.id, updatedRequest);
      } else if ((requestType === requestTypes.SERVICE_SUB_SERVICE_ACCESS)) {
        await updateUserServSubServRequest(request.id, updatedRequest);
      }
    } else if (differenceInDays === (numberOfDaysUntilOverdue - 1)) {
      logger.debug(`Requests for ${requestType} come in here, if  request overdue in following day [if overdue day limit is 5 then it should come here on 4th day]`);
      if (orgIdsByRequestCount && orgIdsByRequestCount.get(request.org_id)) {
        orgIdsByRequestCount.set(request.org_id, orgIdsByRequestCount.get(request.org_id) + 1);
      } else {
        orgIdsByRequestCount.set(request.org_id, 1);
      }
    }
  }
};

const overdueAllRequestsTypes = async() => {
  const dateNow = moment();
  const numberOfDaysUntilOverdue = config.organisationRequests.numberOfDaysUntilOverdue || 5;

  // get all outstanding requests
  logger.debug('Getting outstanding organisation request data');
  const allOutstandingOrgRequests = await listRequests(500, [0], requestTypes.ORGANISATION_ACCESS);

  logger.debug('Getting outstanding service and sub-service request data');
  const allOutstandingServSubServRequests = await listRequests(500, [0], requestTypes.SERVICE_SUB_SERVICE_ACCESS);
  const orgIdsByRequestCount = new Map();

  logger.debug('Overdue organisation access requests older than 5 days');
  await overdueRequests(allOutstandingOrgRequests, requestTypes.ORGANISATION_ACCESS, orgIdsByRequestCount, dateNow, numberOfDaysUntilOverdue);

  logger.debug('Overdue service and sub-service access requests older than 5 days');
  await overdueRequests(allOutstandingServSubServRequests, requestTypes.SERVICE_SUB_SERVICE_ACCESS, orgIdsByRequestCount, dateNow, numberOfDaysUntilOverdue, actionedReasons.OVERDUE);

  if (orgIdsByRequestCount && orgIdsByRequestCount.size > 0) {
    let approversIds = [];
    let approversDetails = [];
    for (const [orgId] of orgIdsByRequestCount) {
      approversIds = [...approversIds, ...await getApproversForOrg(orgId)];
      if (!approversIds) {
        continue;
      }
    }

    if (approversIds.length > 0) {
      const uniqueApproversIds = [...new Set(approversIds)];
      approversDetails = await getUsersByIds(uniqueApproversIds.join(','));
    }

    for (const approver of approversDetails) {
      const emailReminderDateStart = dateNow.clone().utc().subtract(numberOfDaysUntilOverdue - 1, 'days');
      const emailReminderDateEnd = dateNow.clone().utc().subtract((numberOfDaysUntilOverdue - 2), 'days');

      const approversReminderReq = await listApproversReqToOverdue(approver.sub, 15, emailReminderDateStart, emailReminderDateEnd);
      if (approversReminderReq > 0) {
        await notificationClient.sendSupportOverdueRequest(`${approver.given_name} ${approver.family_name}`, approversReminderReq, approver.email);
      }
    }
  }
};

module.exports = overdueAllRequestsTypes;
