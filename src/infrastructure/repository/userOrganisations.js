const Sequelize = require("sequelize").default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define(
    "user_organisation",
    {
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
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      numeric_identifier: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      text_identifier: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "user_organisation",
      schema,
    },
  );
};

const extend = ({ userOrganisations, organisations, users, roles }) => {
  userOrganisations.belongsTo(organisations, {
    as: "Organisation",
    foreignKey: "organisation_id",
  });
  userOrganisations.belongsTo(users, { as: "User", foreignKey: "user_id" });

  userOrganisations.prototype.getRole = function () {
    return roles.find((r) => r.id === this.role_id);
  };
  userOrganisations.prototype.getApprovers = function () {
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
  userOrganisations.prototype.getEndUsers = function () {
    return userOrganisations.findAll({
      where: {
        organisation_id: {
          [Op.eq]: this.organisation_id,
        },
        role_id: {
          [Op.eq]: 0,
        },
      },
    });
  };
};

module.exports = {
  name: "userOrganisations",
  define,
  extend,
};
