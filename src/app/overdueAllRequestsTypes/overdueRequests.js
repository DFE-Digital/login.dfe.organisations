const { NotificationClient } = require("login.dfe.jobs-client");
const logger = require("./../../infrastructure/logger");
const config = require("./../../infrastructure/config")();
const { getUsersByIds } = require("./../../infrastructure/directories");
const {
  pagedListOfRequests,
  updateUserOrgRequest,
  getApproversForOrg,
  pagedListOfServSubServRequests,
  updateUserServSubServRequest,
  getAllPendingRequestTypesForApprover,
} = require("./../organisations/data/organisationsStorage");
const moment = require("moment");

const { requestTypes, actionedReasons } = require("./constants");

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const listRequests = async (pageSize, statuses, requestType) => {
  const allRequests = [];
  let pageNumber = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    let page;
    if (requestType === requestTypes.ORGANISATION_ACCESS) {
      page = await pagedListOfRequests(pageNumber, pageSize, statuses);
    } else if (requestType === requestTypes.SERVICE_SUB_SERVICE_ACCESS) {
      page = await pagedListOfServSubServRequests(
        pageNumber,
        pageSize,
        statuses,
      );
    }
    allRequests.push(...page.requests);

    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber += 1;
  }
  return allRequests;
};

const listApproversReqToOverdue = async (
  userId,
  pageSize,
  filterDateStart,
  filterDateEnd,
) => {
  const result = await getAllPendingRequestTypesForApprover(
    userId,
    1,
    pageSize,
    filterDateStart,
    filterDateEnd,
  );
  return result.totalNumberOfRecords;
};

/**
 *
 * @param {Array} outstandingRequests
 * @param {string} requestType
 * @param {Map} orgIdsByRequestCount
 * @param {moment.Moment} dateNow
 * @param {number} numberOfDaysUntilOverdue
 * @param {string} actionedReason
 *
 * Takes an array of outstanding requests and loops over them.
 * If overdue (based on comparing created_date against the `numberOfDaysUntilOverdue` variable)
 * then it updates the request to an overdue state (status 2).
 *
 * If it will be overdue in 1 days time, it adds it to the `orgIdsByRequestCount` Map as a side effect (as in, it doesn't
 * return the map, it just modifes the object which is then used elsewhere in the code)
 *
 * If it will be overdue in more than 2 days, nothing happens.
 */
const overdueRequests = async (
  outstandingRequests,
  requestType,
  orgIdsByRequestCount,
  dateNow,
  numberOfDaysUntilOverdue,
  actionedReason = undefined,
) => {
  for (let i = 0; i < outstandingRequests.length; i += 1) {
    const request = outstandingRequests[i];

    const differenceInDays =
      dateNow.clone().diff(request.created_date, "days") + 1;

    if (differenceInDays >= numberOfDaysUntilOverdue) {
      // update request as overdue
      let updatedRequest;
      if (actionedReason) {
        updatedRequest = {
          status: 2,
          actioned_reason: actionedReason,
        };
      } else {
        updatedRequest = { status: 2 };
      }

      if (requestType === requestTypes.ORGANISATION_ACCESS) {
        await updateUserOrgRequest(request.id, updatedRequest);
      } else if (requestType === requestTypes.SERVICE_SUB_SERVICE_ACCESS) {
        await updateUserServSubServRequest(request.id, updatedRequest);
      }
    } else if (differenceInDays === numberOfDaysUntilOverdue - 1) {
      logger.info(
        `Requests for ${requestType} come in here, if  request overdue in following day [if overdue day limit is 5 then it should come here on 4th day]`,
      );
      if (orgIdsByRequestCount && orgIdsByRequestCount.get(request.org_id)) {
        orgIdsByRequestCount.set(
          request.org_id,
          orgIdsByRequestCount.get(request.org_id) + 1,
        );
      } else {
        orgIdsByRequestCount.set(request.org_id, 1);
      }
    }
  }
};

const overdueAllRequestsTypes = async () => {
  const dateNow = moment();
  const numberOfDaysUntilOverdue =
    config.organisationRequests.numberOfDaysUntilOverdue || 5;

  // get all outstanding requests
  logger.info("Getting organisation request data with status of 0");
  const allOutstandingOrgRequests = await listRequests(
    500,
    [0],
    requestTypes.ORGANISATION_ACCESS,
  );

  logger.info("Getting service and sub-service request data with status of 0");
  const allOutstandingServSubServRequests = await listRequests(
    500,
    [0],
    requestTypes.SERVICE_SUB_SERVICE_ACCESS,
  );
  const orgIdsByRequestCount = new Map();

  logger.info(
    "Putting org requests that are 1 day until overdue into orgIdsByRequestCount for an email reminder",
  );
  logger.info("Updating org requests are overdue to the overdue status 2");
  await overdueRequests(
    allOutstandingOrgRequests,
    requestTypes.ORGANISATION_ACCESS,
    orgIdsByRequestCount,
    dateNow,
    numberOfDaysUntilOverdue,
  );

  logger.info(
    "Putting service and sub-service requests that are 1 day until overdue into orgIdsByRequestCount for an email reminder",
  );
  logger.info(
    "Updating service and sub-service requests are overdue to the overdue status 2",
  );
  await overdueRequests(
    allOutstandingServSubServRequests,
    requestTypes.SERVICE_SUB_SERVICE_ACCESS,
    orgIdsByRequestCount,
    dateNow,
    numberOfDaysUntilOverdue,
    actionedReasons.OVERDUE,
  );

  // Everything in orgIdsByRequestCount will become overdue in 1 day, so we send a reminder.
  if (orgIdsByRequestCount && orgIdsByRequestCount.size > 0) {
    let approversIds = [];
    let activeApprovers = [];
    for (const [orgId] of orgIdsByRequestCount) {
      approversIds = [...approversIds, ...(await getApproversForOrg(orgId))];

      // This if statement seems unecessary...can be removed?
      if (!approversIds) {
        continue;
      }
    }

    if (approversIds.length > 0) {
      const uniqueApproversIds = [...new Set(approversIds)];
      const approversDetails = await getUsersByIds(
        uniqueApproversIds.join(","),
      );
      // Filters out all approvers who have inactive accounts
      activeApprovers = approversDetails.filter((user) => user.status === 1);
    }

    for (const approver of activeApprovers) {
      const emailReminderDateStart = dateNow
        .clone()
        .utc()
        .subtract(numberOfDaysUntilOverdue - 1, "days");
      const emailReminderDateEnd = dateNow
        .clone()
        .utc()
        .subtract(numberOfDaysUntilOverdue - 2, "days");

      const approversReminderReq = await listApproversReqToOverdue(
        approver.sub,
        15,
        emailReminderDateStart,
        emailReminderDateEnd,
      );
      if (approversReminderReq > 0) {
        await notificationClient.sendSupportOverdueRequest(
          `${approver.given_name} ${approver.family_name}`,
          approversReminderReq,
          approver.email,
        );
      }
    }
  }
};

module.exports = overdueAllRequestsTypes;
