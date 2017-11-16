const InvitationStorage = require('./data/invitationsStorage');
const storage = new InvitationStorage();

const action = async (req, res) => {
  const services = await storage.getForInvitationId(req.params.inv_id);

  res.status(200).send(services);
};

module.exports = action;