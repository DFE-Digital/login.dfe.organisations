const config = require("./../../../infrastructure/config")();
const { getOrgById } = require("./../data/organisationsStorage");
const ServiceNotificationsClient = require("login.dfe.service-notifications.jobs.client");

const serviceNotificationsClient = new ServiceNotificationsClient(
  config.notifications,
);

const raiseNotificationThatOrganisationHasChanged = async (organisationId) => {
  if (!organisationId) {
    throw new Error(
      `raiseNotificationThatOrganisationHasChanged requires organisationId, which is ${organisationId === null ? "null" : "undefined"}`,
    );
  }
  const notificationsEnabled =
    config.toggles && config.toggles.notificationsEnabled === true;
  if (notificationsEnabled) {
    const organisation = await getOrgById(organisationId);
    await serviceNotificationsClient.notifyOrganisationUpdated(organisation);
  }
};

const raiseNotificationThatUserHasChanged = async (userId) => {
  if (!userId) {
    throw new Error(
      `raiseNotificationThatUserHasChanged requires userId, which is ${userId === null ? "null" : "undefined"}`,
    );
  }
  const notificationsEnabled =
    config.toggles && config.toggles.notificationsEnabled === true;
  if (notificationsEnabled) {
    await serviceNotificationsClient.notifyUserUpdated({ sub: userId });
  }
};

module.exports = {
  raiseNotificationThatOrganisationHasChanged,
  raiseNotificationThatUserHasChanged,
};
