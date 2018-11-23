const logger = require('./../../infrastructure/logger');
const { getPageOfApplications } = require('./../../infrastructure/applications');
const { enqueue } = require('./utils');

const getApplicationsRequiringWebServiceSync = async (correlationId) => {
  let pageNumber = 1;
  let hasMorePages = true;
  const applicationsRequiringSync = [];
  while (hasMorePages) {
    const page = await getPageOfApplications(pageNumber, 100, correlationId);
    page.services.forEach((service) => {
      if (service.relyingParty && service.relyingParty.params && service.relyingParty.params.receiveOrganisationUpdates === 'true') {
        applicationsRequiringSync.push({
          id: service.id,
          wsdlUrl: service.relyingParty.params.wsWsdlUrl,
          provisionOrgAction: service.relyingParty.params.wsProvisionOrgAction,
        });
      }
    });

    hasMorePages = pageNumber < page.numberOfPages;
    pageNumber += 1;
  }
  return applicationsRequiringSync;
};

const organisationChangedHandler = async (id, data, queue) => {
  try {
    logger.info(`Received organisationchanged event (id: ${id})`);

    const correlationId = `organisationchanged-${id}`;
    const applications = await getApplicationsRequiringWebServiceSync(correlationId);
    for (let i = 0; i < applications.length; i += 1) {
      await enqueue(queue,'sendorganisationsync', {
        organisationId: data.organisationId,
        application: applications[i],
      });
    }

    logger.info(`Finished processing organisationchanged event (id: ${id})`);
  } catch (e) {
    logger.error(`Error processing organisationchanged event (id: ${id}) - ${e.message}`);
    throw e;
  }
};

module.exports = organisationChangedHandler;