const Sequelize = require("sequelize").default;

// You can only run SELECT queries for this.  Because it's an external table (based in directores)
// If you try to INSERT, DELETE, etc, it will error.

const define = (db, schema) => {
  return db.define(
    "user",
    {
      sub: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "user",
      schema,
    },
  );
};

const extend = ({ user, users }) => {
  user.hasMany(users, {
    foreignKey: "user_id",
  });
};

module.exports = {
  name: "user",
  define,
  extend,
};
