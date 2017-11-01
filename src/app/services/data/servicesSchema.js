'use strict';

const Sequelize = require('sequelize');

const createSchema = (sequalize) => {
  const organisations = sequalize.define('organisation', {
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


  const services = sequalize.define('service', {
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


  const users = sequalize.define('user_services', {
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

  const roles = [
    { id: 0, name: 'End user' },
    { id: 10000, name: 'Approver' },
  ];
  return {
    users,
    services,
    organisations,
    roles,
  };
};

module.exports = createSchema;
