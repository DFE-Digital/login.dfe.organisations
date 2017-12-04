'use strict';



const Sequelize = require('sequelize');
const assert = require('assert');
// const logger = require('./../logger');
const config = require('./../config')();

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
  db = new Sequelize(databaseName, config.database.username, config.database.password, {
    host: config.database.host,
    dialect: config.database.dialect,
    dialectOptions: {
      encrypt: encryptDb,
    }
  });
}

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

const roles = [
  { id: 0, name: 'End user' },
  { id: 10000, name: 'Approver' },
];

module.exports = {
  users,
  services,
  organisations,
  roles,
  invitations,
};
