const Sequelize = require('sequelize').default;

const define = (db, schema) => {
  return db.define('user_service_identifiers', {
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
      primaryKey: true,
      allowNull: false,
    },
    identifier_value: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    timestamps: false,
    tableName: 'user_service_identifiers',
    schema,
  });
};

module.exports = {
  name: 'externalIdentifiers',
  define,
};