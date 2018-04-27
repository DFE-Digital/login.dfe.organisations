const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('organisation', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    Category: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    URN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    UID: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    UKPRN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    EstablishmentNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Status: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ClosedOn: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    Address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: false,
    tableName: 'organisation',
    schema,
  });
};

const extend = ({ organisations, organisationAssociations }) => {
  organisations.hasMany(organisationAssociations, { as: 'associations', foreignKey: 'organisation_id' });
};

module.exports = {
  define,
  extend,
};