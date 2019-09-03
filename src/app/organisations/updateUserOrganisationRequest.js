const { getUserOrgRequestById, updateUserOrgRequest } = require('./data/organisationsStorage');
const logger = require('./../../infrastructure/logger');

const patchableProperties = ['status', 'actioned_by', 'actioned_reason', 'actioned_at'];

const validate = (req) => {
  const keys = Object.keys(req.body);
  if (keys.length === 0) {
    return `Must specify at least one property. Patchable properties ${patchableProperties}`;
  }
  const errorMessages = keys.map((key) => {
    if (!patchableProperties.find(x => x === key)) {
      return `Unpatchable property ${key}. Allowed properties ${patchableProperties}`;
    }
    return null;
  });
  return errorMessages.find(x => x !== null);
};

const updateUserOrganisationRequest = async (req, res) => {
  const correlationId = req.header('x-correlation-id');
  const requestId = req.params.rid;

  try {
    const request = await getUserOrgRequestById(requestId);
    if (!request) {
      return res.status(404).send();
    }

    const validationErrorMessage = validate(req);
    if (validationErrorMessage) {
      return res.status(400).send(validationErrorMessage);
    }

    await updateUserOrgRequest(request.id, req.body);
    return res.status(202).send();
  } catch (e) {
    logger.error(`Error updating request ${requestId} (correlation id: ${correlationId} - ${e.message}`);
    throw e;
  }
};

module.exports = updateUserOrganisationRequest;
