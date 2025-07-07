const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const schedulesSchema = new SimpleSchema({
  establishmentImport: String,
  groupImport: String,
  overdueRequests: String,
});

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis,
});

const togglesSchema = new SimpleSchema({
  generateUserOrgIdentifiers: {
    type: Boolean,
    optional: true,
  },
  generateOrganisationLegacyId: {
    type: Boolean,
    optional: true,
  },
  notificationsEnabled: {
    type: Boolean,
    optional: true,
  },
});

const organisationRequestsSchema = new SimpleSchema({
  numberOfDaysUntilOverdue: {
    type: SimpleSchema.Integer,
    optional: true,
  },
});

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  auth: schemas.apiServerAuth,
  schedules: schedulesSchema,
  database: schemas.sequelizeConnection,
  directories: schemas.apiClient,
  notifications: notificationsSchema,
  toggles: {
    type: togglesSchema,
    optional: true,
  },
  organisationRequests: {
    type: organisationRequestsSchema,
    optional: true,
  },
});
module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger)
};
