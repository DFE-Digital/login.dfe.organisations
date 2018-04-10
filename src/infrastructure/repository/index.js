'use strict';


const Sequelize = require('sequelize').default;

const Op = Sequelize.Op;
const assert = require('assert');
// const logger = require('./../logger');
const config = require('./../config')();

const getIntValueOrDefault = (value, defaultValue = 0) => {
  if (!value) {
    return defaultValue;
  }
  const int = parseInt(value);
  return isNaN(int) ? defaultValue : int;
};

const databaseName = config.database.name || 'postgres';
const encryptDb = config.database.encrypt || false;
const dbSchema = config.database.schema || 'services';

let db;

if (config.database && config.database.postgresUrl) {
  db = new Sequelize(config.database.postgresUrl);
} else {
  assert(config.database.username, 'Database property username must be supplied');
  assert(config.database.password, 'Database property password must be supplied');
  assert(config.database.host, 'Database property host must be supplied');
  assert(config.database.dialect, 'Database property dialect must be supplied, this must be postgres or mssql');

  const dbOpts = {
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
      name: 'query',
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000,
      max: 5,
    },
    host: config.database.host,
    dialect: config.database.dialect,
    operatorsAliases: Op,
    dialectOptions: {
      encrypt: encryptDb,
    },
  };
  if (config.database.pool) {
    dbOpts.pool = {
      max: getIntValueOrDefault(config.database.pool.max, 5),
      min: getIntValueOrDefault(config.database.pool.min, 0),
      acquire: getIntValueOrDefault(config.database.pool.acquire, 10000),
      idle: getIntValueOrDefault(config.database.pool.idle, 10000),
    };
  }

  db = new Sequelize(databaseName, config.database.username, config.database.password, dbOpts);
}

const externalIdentifiers = db.define('user_service_identifiers', {
  user_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  service_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  organisation_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  identifier_key: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  identifier_value: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'user_service_identifiers',
  schema: dbSchema,
});

const organisations = db.define('organisation', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Category: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Type: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  URN: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  UID: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  UKPRN: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  EstablishmentNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Status: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  ClosedOn: {
    type: Sequelize.DATE,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'organisation',
  schema: dbSchema,
});


const services = db.define('service', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'service',
  schema: dbSchema,
});
services.prototype.getExternalIdentifier = function (key, value) {
  return externalIdentifiers.find({
    where:
      {
        service_id:
          {
            [Op.eq]: this.id,
          },
        identifier_key:
          {
            [Op.eq]: key,
          },
        identifier_value:
          {
            [Op.eq]: value,
          },
      },
  });
};

const users = db.define('user_services', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  user_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  status: {
    type: Sequelize.SMALLINT,
    allowNull: false,
  },
  role_id: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'user_services',
  schema: dbSchema,

});
users.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
users.belongsTo(services, { as: 'Service', foreignKey: 'service_id' });
users.prototype.getApprovers = function () {
  return users.findAll({
    where:
      {
        service_id:
          {
            [Op.eq]: this.service_id,
          },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
        role_id: {
          [Op.eq]: 10000,
        },
        status: {
          [Op.eq]: 1,
        },
      },

  });
};
users.prototype.getExternalIdentifiers = function () {
  return externalIdentifiers.findAll({
    where:
      {
        user_id:
          {
            [Op.eq]: this.user_id,
          },
        service_id:
          {
            [Op.eq]: this.service_id,
          },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
  });
};
users.prototype.setExternalIdentifier = async function (key, value) {
  const existing = await externalIdentifiers.find({
    where:
      {
        user_id: {
          [Op.eq]: this.user_id,
        },
        service_id: {
          [Op.eq]: this.service_id,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
        identifier_key: {
          [Op.eq]: key,
        },
      },
  });
  if (existing) {
    existing.destroy();
  }
  await externalIdentifiers.create({
    user_id: this.user_id,
    organisation_id: this.organisation_id,
    service_id: this.service_id,
    identifier_key: key,
    identifier_value: value,
  });
};


const invitationExternalIdentifiers = db.define('invitation_service_identifiers', {
  invitation_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  service_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  organisation_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  identifier_key: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  identifier_value: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'invitation_service_identifiers',
  schema: dbSchema,
});

const invitations = db.define('invitation_services', {
  invitation_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  role_id: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: false,
  tableName: 'invitation_services',
  schema: dbSchema,
});
invitations.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
invitations.belongsTo(services, { as: 'Service', foreignKey: 'service_id' });
invitations.prototype.getApprovers = function () {
  return users.findAll({
    where:
      {
        service_id:
          {
            [Op.eq]: this.service_id,
          },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
        role_id: {
          [Op.eq]: 10000,
        },
        status: {
          [Op.eq]: 1,
        },
      },

  });
};
invitations.prototype.getExternalIdentifiers = function () {
  return invitationExternalIdentifiers.findAll({
    where:
      {
        invitation_id:
          {
            [Op.eq]: this.invitation_id,
          },
        service_id:
          {
            [Op.eq]: this.service_id,
          },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
  });
};
invitations.prototype.setExternalIdentifier = async function (key, value) {
  const existing = await invitationExternalIdentifiers.find({
    where:
      {
        invitation_id: {
          [Op.eq]: this.invitation_id,
        },
        service_id: {
          [Op.eq]: this.service_id,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
        identifier_key: {
          [Op.eq]: key,
        },
      },
  });
  if (existing) {
    existing.destroy();
  }
  await invitationExternalIdentifiers.create({
    invitation_id: this.invitation_id,
    organisation_id: this.organisation_id,
    service_id: this.service_id,
    identifier_key: key,
    identifier_value: value,
  });
};


const roles = [
  { id: 0, name: 'End user' },
  { id: 10000, name: 'Approver' },
];

const organisationStatus = [
  { id: 1, name: 'Open' },
  { id: 2, name: 'Closed' },
  { id: 3, name: 'Proposed to close' },
  { id: 4, name: 'Proposed to open' },
];

const organisationCategory = [
  { id: '001', name: 'Establishment' },
  { id: '002', name: 'Local Authority' },
  { id: '010', name: 'Multi-Academy Trust' },
  { id: '013', name: 'Single-Academy Trust' },
];

module.exports = {
  users,
  services,
  organisations,
  roles,
  invitations,
  organisationStatus,
  organisationCategory,
};
