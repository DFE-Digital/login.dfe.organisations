const Sequelize = require("sequelize").default;

const define = (db, schema) => {
  return db.define(
    "organisation_announcement",
    {
      announcement_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      origin_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      organisation_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      type: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      summary: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      body: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "organisation_announcement",
      schema,
    },
  );
};

const extend = ({ organisationAnnouncements, organisations }) => {
  organisationAnnouncements.belongsTo(organisations, {
    as: "Organisation",
    foreignKey: "organisation_id",
  });
};

module.exports = {
  name: "organisationAnnouncements",
  define,
  extend,
};
