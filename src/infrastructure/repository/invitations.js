const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('invitation_services', {
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
    schema,
  });
};

const extend = ({ invitations, organisations, services, users, invitationExternalIdentifiers }) => {
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
};

module.exports = {
  define,
  extend,
};