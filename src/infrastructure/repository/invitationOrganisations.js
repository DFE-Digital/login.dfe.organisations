const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('invitation_organisation', {
    invitation_id: {
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
    tableName: 'invitation_organisation',
    schema,
  });
};

const extend = ({ invitationOrganisations, organisations, users }) => {
  invitationOrganisations.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
  invitationOrganisations.belongsTo(users, { as: 'Invitation', foreignKey: 'invitation_id' });
};

module.exports = {
  name: 'invitationOrganisations',
  define,
  extend,
};