const Sequelize = require("sequelize").default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define(
    "user_services",
    {
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
    },
    {
      timestamps: true,
      tableName: "user_services",
      schema,
    },
  );
};

const extend = ({
  users,
  organisations,
  services,
  externalIdentifiers,
  userOrganisations,
  roles,
}) => {
  users.belongsTo(organisations, {
    as: "Organisation",
    foreignKey: "organisation_id",
  });
  users.belongsTo(services, { as: "Service", foreignKey: "service_id" });
  users.prototype.getApprovers = function () {
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
  users.prototype.getExternalIdentifiers = function () {
    return externalIdentifiers.findAll({
      where: {
        user_id: {
          [Op.eq]: this.user_id,
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
  users.prototype.setExternalIdentifier = async function (key, value) {
    await externalIdentifiers.upsert({
      user_id: this.user_id,
      organisation_id: this.organisation_id,
      service_id: this.service_id,
      identifier_key: key,
      identifier_value: value,
    });
  };
  users.prototype.getRole = async function () {
    const userOrganisation = await userOrganisations.findOne({
      where: {
        user_id: {
          [Op.eq]: this.user_id,
        },
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
      },
    });
    if (!userOrganisation) {
      return undefined;
    }

    return roles.find((r) => r.id === userOrganisation.role_id);
  };
};

module.exports = {
  name: "users",
  define,
  extend,
};
