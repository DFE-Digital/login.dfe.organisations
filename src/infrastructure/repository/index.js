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
    logging: false,
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

const organisationAssociations = db.define('organisation_association', {
  organisation_id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
  },
  associated_organisation_id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
  },
  link_type: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
  },
}, {
  timestamps: false,
  tableName: 'organisation_association',
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
  Address: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'organisation',
  schema: dbSchema,
});
organisations.hasMany(organisationAssociations, { as: 'associations', foreignKey: 'organisation_id' });


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

const establishmentTypes = [
  { id: '01', name: 'Community School' },
  { id: '02', name: 'Voluntary Aided School' },
  { id: '03', name: 'Voluntary Controlled School' },
  { id: '05', name: 'Foundation School' },
  { id: '06', name: 'City Technology College' },
  { id: '07', name: 'Community Special School' },
  { id: '08', name: 'Non-Maintained Special School' },
  { id: '10', name: 'Other Independent Special School' },
  { id: '11', name: 'Other Independent School' },
  { id: '12', name: 'Foundation Special School' },
  { id: '14', name: 'Pupil Referral Unit' },
  { id: '15', name: 'LA Nursery School' },
  { id: '18', name: 'Further Education' },
  { id: '24', name: 'Secure Units' },
  { id: '25', name: 'Offshore Schools' },
  { id: '26', name: 'Service Childrens Education' },
  { id: '28', name: 'Academy Sponsor Led' },
  { id: '30', name: 'Welsh Establishment' },
  { id: '32', name: 'Special Post 16 Institution' },
  { id: '33', name: 'Academy Special Sponsor Led' },
  { id: '34', name: 'Academy Converter' },
  { id: '35', name: 'Free Schools' },
  { id: '36', name: 'Free Schools Special' },
  { id: '38', name: 'Free Schools - Alternative Provision' },
  { id: '39', name: 'Free Schools - 16-19' },
  { id: '40', name: 'University Technical College' },
  { id: '41', name: 'Studio Schools' },
  { id: '42', name: 'Academy Alternative Provision Converter' },
  { id: '43', name: 'Academy Alternative Provision Sponsor Led' },
  { id: '44', name: 'Academy Special Converter' },
  { id: '45', name: 'Academy 16-19 Converter' },
  { id: '46', name: 'Academy 16-19 Sponsor Led' },
];

module.exports = {
  users,
  services,
  organisations,
  organisationAssociations,
  roles,
  invitations,
  organisationStatus,
  organisationCategory,
  establishmentTypes,
};
