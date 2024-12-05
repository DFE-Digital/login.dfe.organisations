const Sequelize = require("sequelize").default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define(
    "role",
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      numericId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      parentId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "role",
      schema,
    },
  );
};

const extend = () => {};

module.exports = {
  name: "role",
  define,
  extend,
};
