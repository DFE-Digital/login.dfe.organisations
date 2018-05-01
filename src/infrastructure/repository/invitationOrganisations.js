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

const extend = ({ invitationOrganisations, organisations, users, roles, userOrganisations }) => {
  invitationOrganisations.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
  invitationOrganisations.belongsTo(users, { as: 'Invitation', foreignKey: 'invitation_id' });

  invitationOrganisations.prototype.getRole = function () {
    return roles.find(r => r.id === this.role_id);
  };
  invitationOrganisations.prototype.getApprovers = function () {
    return userOrganisations.findAll({
      where: {
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
        role_id: {
          [Op.eq]: 10000,
        },
      },
    });
  };
};

module.exports = {
  name: 'invitationOrganisations',
  define,
  extend,
};