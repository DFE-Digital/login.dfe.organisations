const Sequelize = require("sequelize").default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define(
    "invitation_service_roles",
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      invitation_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      organisation_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "invitation_service_roles",
      schema,
    },
  );
};

const extend = ({ role, invitationServiceRoles }) => {
  invitationServiceRoles.belongsTo(role, { as: "Role", foreignKey: "role_id" });
};

module.exports = {
  name: "invitationServiceRoles",
  define,
  extend,
};
