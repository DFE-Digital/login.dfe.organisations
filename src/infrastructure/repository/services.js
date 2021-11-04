const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('service', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: false,
    tableName: 'service',
    schema,
  });
};

const extend = ({ services, externalIdentifiers }) => {
  services.prototype.getExternalIdentifier = function (key, value) {
    return externalIdentifiers.findOne({
      where:
        {
          service_id:
            {
              [Op.eq]: this.id,
            },
          identifier_key:
            {
              [Op.eq]: key,
            },
          identifier_value:
            {
              [Op.eq]: value,
            },
        },
    });
  };
};

module.exports = {
  name: 'services',
  define,
  extend,
};