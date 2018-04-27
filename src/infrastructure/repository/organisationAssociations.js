const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('organisation_association', {
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
  }, {
    timestamps: false,
    tableName: 'organisation_association',
    schema,
  });
};

const extend = () => {
};

module.exports = {
  define,
  extend,
};