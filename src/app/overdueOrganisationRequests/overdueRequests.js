const NotificationClient = require('login.dfe.notifications.client');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config')();
const { getUserById } = require('./../../infrastructure/directories');

const moment = require('moment');
const { pagedListOfRequests, updateUserOrgRequest } = require('./../organisations/data/organisationsStorage');

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

      const userDetails = await getUserById(request.user_id);
      await notificationClient.sendSupportRequest(`${userDetails.given_name} ${userDetails.family_name}`, userDetails.email, null, null, 'Access to an organisation', `Organisation request for ${request.org_name}, no approvers exist. Request reason: ${request.reason}`, request.org_name, null);
    }
  }
};

module.exports = overdueOrganisationRequests;
