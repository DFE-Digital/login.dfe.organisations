const NotificationClient = require('login.dfe.notifications.client');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config')();
const { getUserById, getUsersByIds } = require('./../../infrastructure/directories');

const moment = require('moment');
const { pagedListOfRequests, updateUserOrgRequest, getApproversForOrg } = require('./../organisations/data/organisationsStorage');

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const listRequests = async (pageSize, statuses) => {
  const allRequests = [];
  let pageNumber = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    const page = await pagedListOfRequests(pageNumber, pageSize, statuses);
    allRequests.push(...page.requests);

    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber += 1;
  }
  return allRequests;
};


const overdueOrganisationRequests = async () => {
  // get all outstanding requests
  logger.debug('Getting outstanding organisation request data');
  const allOutstandingRequests = await listRequests(500, [0, 3]);
  const orgIdsByRequestCount = new Map();
  for (let i = 0; i < allOutstandingRequests.length; i += 1) {
    const request = allOutstandingRequests[i];
    const date = moment();
    const differenceInDays = date.diff(request.created_date, 'days') + 1;
    const numberOfDaysUntilOverdue = config.organisationRequests.numberOfDaysUntilOverdue || 5;
    if (differenceInDays >= numberOfDaysUntilOverdue) {
      // update request as overdue
      const updatedRequest = {
        status: 2,
      };
      await updateUserOrgRequest(request.id, updatedRequest);
    } else if ( differenceInDays === ( numberOfDaysUntilOverdue - 1 ) ) {
      logger.debug('Request comes in here, if request overdue in following day [if overdue day limit is 5 then it should come here on 4th day]');
      if (orgIdsByRequestCount && orgIdsByRequestCount.get(request.org_id)) {
        orgIdsByRequestCount.set(request.org_id, orgIdsByRequestCount.get(request.org_id) + 1);
      } else {
        orgIdsByRequestCount.set(request.org_id, 1);
      }
    }
  }
  if(orgIdsByRequestCount && orgIdsByRequestCount.size > 0){
    for(let [orgId, count] of orgIdsByRequestCount) {
      const approvers = await getApproversForOrg(orgId);
      const approversDetails = await getUsersByIds(approvers.join(','));
      for(const approver of approversDetails){
        await notificationClient.sendSupportOverdueRequest(`${approver.given_name} ${approver.family_name}`, count, approver.email);
      }
    }
  }
};

module.exports = overdueOrganisationRequests;
