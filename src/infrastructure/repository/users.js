const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const define = (db, schema) => {
  return db.define('user_services', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
    },
    role_id: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    tableName: 'user_services',
    schema,
  });
};

const extend = ({ users, organisations, services, externalIdentifiers }) => {
  users.belongsTo(organisations, { as: 'Organisation', foreignKey: 'organisation_id' });
  users.belongsTo(services, { as: 'Service', foreignKey: 'service_id' });
  users.prototype.getApprovers = function () {
    return users.findAll({
      where:
        {
          service_id:
            {
              [Op.eq]: this.service_id,
            },
          organisation_id: {
            [Op.eq]: this.organisation_id,
          },
          role_id: {
            [Op.eq]: 10000,
          },
          status: {
            [Op.eq]: 1,
          },
        },

    });
  };
  users.prototype.getExternalIdentifiers = function () {
    return externalIdentifiers.findAll({
      where:
        {
          user_id:
            {
              [Op.eq]: this.user_id,
            },
          service_id:
            {
              [Op.eq]: this.service_id,
            },
          organisation_id: {
            [Op.eq]: this.organisation_id,
          },
        },
    });
  };
  users.prototype.setExternalIdentifier = async function (key, value) {
    const existing = await externalIdentifiers.find({
      where:
        {
          user_id: {
            [Op.eq]: this.user_id,
          },
          service_id: {
            [Op.eq]: this.service_id,
          },
          organisation_id: {
            [Op.eq]: this.organisation_id,
          },
          identifier_key: {
            [Op.eq]: key,
          },
        },
    });
    if (existing) {
      existing.destroy();
    }
    await externalIdentifiers.create({
      user_id: this.user_id,
      organisation_id: this.organisation_id,
      service_id: this.service_id,
      identifier_key: key,
      identifier_value: value,
    });
  };
};

module.exports = {
  define,
  extend,
};