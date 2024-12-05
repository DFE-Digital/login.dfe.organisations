const Sequelize = require("sequelize").default;

const define = (db, schema) => {
  return db.define(
    "organisation_association",
    {
      organisation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      associated_organisation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      link_type: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      timestamps: false,
      tableName: "organisation_association",
      schema,
    },
  );
};

module.exports = {
  name: "organisationAssociations",
  define,
};
