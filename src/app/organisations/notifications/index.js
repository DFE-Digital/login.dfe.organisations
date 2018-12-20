const config = require('./../../../infrastructure/config')();
const { getOrgById } = require('./../data/organisationsStorage');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);

const raiseNotificationThatOrganisationHasChanged = async (organisationId) => {
  const organisation = await getOrgById(organisationId);
  await serviceNotificationsClient.notifyOrganisationUpdated(organisation);
};

module.exports = {
  raiseNotificationThatOrganisationHasChanged,
};
