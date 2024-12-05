const invitationStorage = require("./data/invitationsStorage");

const action = async (req, res) => {
  const organisationsWithServices = await invitationStorage.getForInvitationId(
    req.params.inv_id,
    req.header("x-correlation-id"),
  );
  if (!organisationsWithServices) {
    res.status(404).send();
    return;
  }

  const services = [];
  organisationsWithServices.forEach((organisation) => {
    organisation.services.forEach((service) => {
      services.push({
        invitationId: organisation.invitationId,
        role: organisation.role,
        service: {
          id: service.id,
          name: service.name,
        },
        organisation: organisation.organisation,
        approvers: organisation.approvers,
        externalIdentifiers: service.externalIdentifiers,
      });
    });
  });

  res.status(200).send(services);
};

module.exports = action;
