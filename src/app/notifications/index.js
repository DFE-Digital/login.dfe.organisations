const config = require('./../../infrastructure/config')();
const logger = require('./../../infrastructure/logger');
const kue = require('kue');
const { enqueue } = require('./utils');
const handleOrganisationChanged = require('./organisationChangedHandler');
const handleSendOrganisationSync = require('./sendOrganisationSyncHandler');

const queue = kue.createQueue({
  redis: config.notifications.connectionString,
});
queue.on('error', (e) => {
  logger.warn(`An error occurred in the monitor queue - ${e.message}`, e);
});

const startMonitoring = () => {
  logger.info('Monitoring for organisationChangedHandler events');
  queue.process('organisationchanged', (job, done) => {
    handleOrganisationChanged(job.id, job.data, queue)
      .then(() => done())
      .catch(e => done(e));
  });
  queue.process('sendorganisationsync', (job, done) => {
    handleSendOrganisationSync(job.id, job.data, queue)
      .then(() => done())
      .catch(e => done(e));
  });
};
const stopMonitoring = async () => {
  return new Promise((reject, resolve) => {
    try {
      queue.shutdown(5000, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};

const raiseNotificationThatOrganisationHasChanged = async (organisationId) => {
  await enqueue(queue,'organisationchanged', { organisationId });
};

module.exports = {
  startMonitoring,
  stopMonitoring,
  raiseNotificationThatOrganisationHasChanged,
};
