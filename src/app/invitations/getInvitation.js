const invitationStorage = require('./data/invitationsStorage');

const action = async (req, res) => {
  const services = await invitationStorage.getForInvitationId(req.params.inv_id, req.header('x-correlation-id'));
  if (!services) {
    res.status(404).send();
    return;
  }

  res.status(200).send(services);
};

module.exports = action;
