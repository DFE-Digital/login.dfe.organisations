const uuid = require("uuid");
const invitationStorage = require("./data/invitationsStorage");
const serviceStorage = require("./../services/data/servicesStorage");
const organisationsStorage = require("./../organisations/data/organisationsStorage");
const { getUserOrganisationIdentifiers } = require("./../organisations/utils");
const config = require("./../../infrastructure/config")();
const NotificationClient = require("login.dfe.notifications.client");
const { getUserById } = require("./../../infrastructure/directories");

const APPROVED_STATUS = 1;

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const handler = async (req, res) => {
  const invitationId = req.params.inv_id;
  const userId = req.body.user_id;
  const userDetails = await getUserById(userId);

  const services = await invitationStorage.getForInvitationId(
    invitationId,
    req.header("x-correlation-id"),
  );
  if (services) {
    for (let o = 0; o < services.length; o += 1) {
      const org = services[o];

      const { numericIdentifier, textIdentifier } =
        await getUserOrganisationIdentifiers(
          userId,
          org.organisation.id,
          undefined,
          undefined,
        );

      await organisationsStorage.setUserAccessToOrganisation(
        org.organisation.id,
        userId,
        org.role.id,
        APPROVED_STATUS,
        "",
        numericIdentifier,
        textIdentifier,
      );

      for (let s = 0; s < org.services.length; s += 1) {
        const svc = org.services[s];
        await serviceStorage.upsertServiceUser(
          {
            id: uuid.v4(),
            userId,
            organisationId: org.organisation.id,
            serviceId: svc.id,
            roleId: org.role.id,
            status: APPROVED_STATUS,
            externalIdentifiers: svc.externalIdentifiers,
          },
          req.header("x-correlation-id"),
        );

        const orgRole = {
          id: org.role.id,
          name: org.role.name,
        };

        const svcRoles = svc.serviceRoles.map((i) => {
          if (i.Role) {
            return i.Role.name;
          }
        });

        await notificationClient.sendServiceRequestApproved(
          userDetails.email,
          userDetails.given_name,
          userDetails.family_name,
          org.organisation.name,
          svc.name,
          svcRoles,
          orgRole,
        );
      }
    }
  }

  res.status(202).send();
};

module.exports = handler;
