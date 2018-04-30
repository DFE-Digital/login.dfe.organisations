const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('user_organisation', {
    user_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    organisation_id: {
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
    timestamps: true,
    tableName: 'user_organisation',
    schema,
  });
};

const extend = ({ userOrganisations, organisations, users }) => {
  userOrganisations.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
  userOrganisations.belongsTo(users, { as: 'User', foreignKey: 'user_id' });
};

module.exports = {
  name: 'userOrganisations',
  define,
  extend,
};