const fs = require('fs');
const os = require('os');
const path = require('path');

require('dotenv').config();

const config = {
  loggerSettings: {
    applicationName: "Organisations API",
    logLevel: "info",
    auditDb: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  hostingEnvironment: {
    useDevViews: false,
    env: process.env.LOCAL_ENV || "azure",
    host: process.env.LOCAL_HOST || process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
    port: process.env.LOCAL_PORT_ORGANISATIONS || 443,
    sslCert: process.env.LOCAL_SSL_CERT ? process.env.LOCAL_SSL_CERT.replace(/\\n/g, '\n') : "",
    sslKey: process.env.LOCAL_SSL_KEY ? process.env.LOCAL_SSL_KEY.replace(/\\n/g, '\n') : "",
    protocol: "https",
    applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    agentKeepAlive: {
      maxSockets: 30,
      maxFreeSockets: 10,
      timeout: 60000,
      keepAliveTimeout: 30000
    }
  },
  auth: {
    type: "aad",
    identityMetadata: process.env.TENANT_URL + "/.well-known/openid-configuration",
    clientID: process.env.AAD_SHD_APP_ID
  },
  database: {
    host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
    username: process.env.SVC_SIGNIN_ORG,
    password: process.env.SVC_SIGNIN_ORG_PASSWORD,
    dialect: "mssql",
    name: process.env.PLATFORM_GLOBAL_ORGANISATIONS_DATABASE_NAME,
    encrypt: true,
    schema: "dbo",
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  directories: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  notifications: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true"
  },
  organisationRequests: {
    numberOfDaysUntilOverdue: 5
  },
  schedules: {
    overdueRequests: "0 0 * * *"
  },
  toggles: {
    generateUserOrgIdentifiers: true,
    generateOrganisationLegacyId: true,
    notificationsEnabled: true
  }
}

// Persist configuration to a temporary file and then point the `settings` environment
// variable to the path of the temporary file. The `login.dfe.dao` package can then load
// this configuration.
function mimicLegacySettings(config) {
  // TODO: This can be improved by refactoring the `login.dfe.dao` package.
  const tempDirectoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'config-'));
  const tempConfigFilePath = path.join(tempDirectoryPath, 'config.json');

  fs.writeFileSync(tempConfigFilePath, JSON.stringify(config), { encoding: 'utf8' });
  process.env.settings = tempConfigFilePath;
}

mimicLegacySettings(config);

module.exports = config;
