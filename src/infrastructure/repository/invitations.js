const Sequelize = require("sequelize").default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define(
    "invitation_services",
    {
      invitation_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "invitation_services",
      schema,
    },
  );
};

const extend = ({
  invitations,
  organisations,
  services,
  users,
  invitationExternalIdentifiers,
  invitationOrganisations,
  roles,
  userOrganisations,
}) => {
  invitations.belongsTo(organisations, {
    as: "Organisation",
    foreignKey: "organisation_id",
  });
  invitations.belongsTo(services, { as: "Service", foreignKey: "service_id" });
  invitations.prototype.getApprovers = function () {
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
  invitations.prototype.getExternalIdentifiers = function () {
    return invitationExternalIdentifiers.findAll({
      where: {
        invitation_id: {
          [Op.eq]: this.invitation_id,
        },
        service_id: {
          [Op.eq]: this.service_id,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
    });
  };
  invitations.prototype.setExternalIdentifier = async function (key, value) {
    const existing = await invitationExternalIdentifiers.findOne({
      where: {
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
  invitations.prototype.getRole = async function () {
    const invitationOrganisation = await invitationOrganisations.findOne({
      where: {
        invitation_id: {
          [Op.eq]: this.invitation_id,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
    });
    if (!invitationOrganisation) {
      return undefined;
    }

    return roles.find((r) => r.id === invitationOrganisation.role_id);
  };
};

module.exports = {
  name: "invitations",
  define,
  extend,
};
