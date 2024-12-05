const Sequelize = require("sequelize").default;

const define = (db, schema) => {
  return db.define(
    "counters",
    {
      counter_name: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      next_value: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "counters",
      schema,
    },
  );
};

const extend = () => {};

module.exports = {
  name: "counters",
  define,
  extend,
};
