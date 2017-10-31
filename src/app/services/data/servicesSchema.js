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

  }, {
    timestamps: false,
    tableName: 'user_services',
    schema: 'services',
  });

  users.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
  users.belongsTo(services, { as: 'Service', foreignKey: 'service_id' });

  return {
    users,
    services,
    organisations,
  };
};

module.exports = createSchema;
