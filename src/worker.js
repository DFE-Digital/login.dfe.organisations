const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const { importEstablishments } = require('./app/giasImport');

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

runSchedule('import establishments', '*/5 * * * *', importEstablishments);