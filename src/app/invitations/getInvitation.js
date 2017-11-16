const InvitationStorage = require('./data/invitationsStorage');
const storage = new InvitationStorage();

const action = async (req, res) => {
  const services = await storage.getForInvitationId(req.params.inv_id);
  if (!services) {
    res.status(404).send();
    return;
  }

  res.status(200).send(services);
};

module.exports = action;