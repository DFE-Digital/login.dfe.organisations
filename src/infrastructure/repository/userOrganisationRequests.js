const Sequelize = require('sequelize').default;

const define = (db, schema) => {
  return db.define('user_organisation_requests', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    actioned_by: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    actioned_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    actioned_reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'user_organisation_requests',
    schema,
  });
};

const extend = ({ userOrganisationRequests, organisations }) => {
  userOrganisationRequests.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
};

module.exports = {
  name: 'userOrganisationRequests',
  define,
  extend,
};
