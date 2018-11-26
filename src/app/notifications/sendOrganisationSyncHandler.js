const logger = require('./../../infrastructure/logger');
const { getOrgById } = require('./../organisations/data/organisationsStorage');
const SecureAccessWebServiceClient = require('./SecureAccessWebServiceClient');
const { webServiceStatus } = require('./../../infrastructure/repository');
const { Op } = require('sequelize');

const getLastStatusSentToApplicationForOrganisation = async (organisationId, applicationId) => {
  const entity = await webServiceStatus.find({
    where: {
      organisation_id: {
        [Op.eq]: organisationId,
      },
      application_id: {
        [Op.eq]: applicationId,
      },
    },
  });
  const lastStatus = entity ? entity.last_action : undefined;

  return lastStatus ? 'UPDATE' : 'CREATE';
};
const setLastStatusSendToApplicationForOrganisation = async (organisationId, applicationId, status) => {
  const result = await webServiceStatus.update({
    last_action: status,
  }, {
    where: {
      organisation_id: {
        [Op.eq]: organisationId,
      },
      application_id: {
        [Op.eq]: applicationId,
      },
    },
  });
  if (!result || result[0] === 0) {
    await webServiceStatus.create({
      organisation_id: organisationId,
      application_id: applicationId,
      last_action: status,
    });
  }
};

const organisationChangedHandler = async (id, data) => {
  const correlationId = `sendorganisationsync-${id}`;
  try {
    logger.info(`Received sendorganisationsync event (id: ${id})`, { correlationId });

    const { organisationId, application } = data;

    const wsClient = await SecureAccessWebServiceClient.create(application.wsdlUrl, application.provisionOrgAction, correlationId);
    const organisation = await getOrgById(organisationId);
    const action = await getLastStatusSentToApplicationForOrganisation(organisationId, application.id);
    const laCode = organisation.localAuthority ? organisation.localAuthority.code : undefined;
    const typeId = organisation.type ? organisation.type.id : undefined;
    const establishmentNumber = organisation.localAuthority ? `${organisation.localAuthority.code}${organisation.establishmentNumber}` : undefined;

    logger.info(`Sending sync (${action}) to ${application.id} for organisation ${organisationId}`);
    await wsClient.provisionOrganisation(action, establishmentNumber, organisation.urn, laCode,
      typeId, organisation.legacyId, organisation.name, organisation.category.id, organisation.status.id);

    await setLastStatusSendToApplicationForOrganisation(organisationId, application.id, action);

    logger.info(`Finished processing sendorganisationsync event (id: ${id})`, { correlationId });
  } catch (e) {
    logger.error(`Error processing sendorganisationsync event (id: ${id}) - ${e.message}`, { correlationId });
    throw e;
  }
};

module.exports = organisationChangedHandler;
