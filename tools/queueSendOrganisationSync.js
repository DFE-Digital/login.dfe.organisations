const config = require('./../src/infrastructure/config')();
const kue = require('kue');

const queue = kue.createQueue({
  redis: config.notifications.connectionString,
});
queue.on('error', (e) => {
  console.warn(`An error occurred in the monitor queue - ${e.message}`, e);
});

const job = queue.create('sendorganisationsync', {
  organisationId: 'B024C5A5-5F44-419A-8EAD-E30115DDB693',
  application: {
    id: '',
    wsdlUrl: '',
    provisionOrgAction: '',
  },
});
job.save((err) => {
  if (err) {
    console.error(`Failed to save job - ${err}`);
  } else {
    console.info(`Job saved ${job.id}`);
  }
  process.exit();
});
