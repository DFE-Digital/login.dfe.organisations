const { deleteUserService } = require('./data/servicesStorage');

const deleteUserAccess = async (req, res) => {
  const organisationId = req.params.org_id;
  const serviceId = req.params.sid;
  const userId = req.params.uid;
  const correlationId = req.header('x-correlation-id');

  await deleteUserService(organisationId, serviceId, userId, correlationId);

  return res.status(204).send();
};

module.exports = deleteUserAccess;
