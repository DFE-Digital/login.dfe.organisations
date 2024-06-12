const { deleteUserOrganisation, getServiceAndSubServiceReqForOrgs, updateUserServSubServRequest } = require('./data/organisationsStorage');

const deleteOrg = async (req, res) => {
  const correlationId = req.get('x-correlation-id');
  const { id: orgId, uid: userId } = req.params;

  try {
    // Retrieve any service requests that the user has for this organisation
    const requests = await getServiceAndSubServiceReqForOrgs(JSON.stringify([orgId]));
    const requestsForUser = requests.filter(request => request.user_id === userId);

    await Promise.all(
      requestsForUser.map(async (request) => {
        request.status = -1;
        request.reason = 'User has left organisation.';
        request.actioned_reason = 'Rejected';
        await updateUserServSubServRequest(request.id, request);
      })
    );

    // Delete the user organisation mapping
    await deleteUserOrganisation(orgId, userId, correlationId);

    res.status(204).send();
  } catch (error) {
    console.error('Error processing user requests for deletion:', { error, correlationId, orgId, userId });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = deleteOrg;