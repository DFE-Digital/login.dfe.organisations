'use strict';

const Sequelize = require('sequelize');
const assert = require('assert');
// const logger = require('./../logger');
const config = require('./../config')();

let db;

if (config.database && config.database.postgresUrl) {
  db = new Sequelize(config.database.postgresUrl);
} else {
  assert(config.database.username, 'Database property username must be supplied');
  assert(config.database.password, 'Database property password must be supplied');
  assert(config.database.host, 'Database property host must be supplied');
  db = new Sequelize('postgres', config.database.username, config.database.password, {
    host: config.database.host,
    dialect: 'postgres',
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
  schema: 'services',
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
  schema: 'services',
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
  timestamps: false,
  tableName: 'user_services',
  schema: 'services',
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
  schema: 'services',
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
