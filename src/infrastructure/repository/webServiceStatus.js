const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('web_service_status', {
    organisation_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    application_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    last_action: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'web_service_status',
    schema,
  });
};

const extend = () => {

};

module.exports = {
  name: 'webServiceStatus',
  define,
  extend,
};