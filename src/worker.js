const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config')();
const schedule = require('node-schedule');
const { importEstablishments, importGroups } = require('./app/giasImport');
const { organisationsSchema, validateConfig } = require('login.dfe.config.schema');
const express = require('express');
const healthCheck = require('login.dfe.healthcheck');

const runSchedule = (name, cronInterval, action) => {
  const job = schedule.scheduleJob(cronInterval, () => {
    logger.info(`Starting invocation of ${name}`);
    try {
      const result = action();
      if (result instanceof Promise) {
        result.then(() => {
          logger.info(`Successfully completed ${name}`);
          logger.info(`next invocation of ${name} will be at ${job.nextInvocation()}`);
        }).catch((e) => {
          logger.error(`Error occured in ${name} - ${e.message}`);
        });
      } else {
        logger.info(`Successfully completed ${name}`);
        logger.info(`next invocation of ${name} will be at ${job.nextInvocation()}`);
      }
    } catch (e) {
      logger.error(`Error occured in ${name} - ${e.message}`);
    }
  });
  logger.info(`first invocation of ${name} will be at ${job.nextInvocation()}`);
};


validateConfig(organisationsSchema, config, logger, config.hostingEnvironment.env !== 'dev');

runSchedule('import establishments', config.schedules.establishmentImport, importEstablishments);
runSchedule('import groups', config.schedules.groupImport, importGroups);


const port = process.env.PORT || 3000;
const app = express();
app.use('/healthcheck', healthCheck({ config }));
app.get('/', (req, res) => {
  res.send();
});
app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});
