'use strict';

const Sequelize = require('sequelize');
const assert = require('assert');
// const logger = require('./../logger');
const config = require('./../config')();

let sequelize;

if (config.database && config.database.postgresUrl) {
  sequelize = new Sequelize(config.database.postgresUrl);
} else {
  assert(config.database.username, 'Database property username must be supplied');
  assert(config.database.password, 'Database property password must be supplied');
  assert(config.database.host, 'Database property host must be supplied');
  sequelize = new Sequelize('postgres', config.database.username, config.database.password, {
    host: config.database.host,
    dialect: 'postgres'
  });
}

module.exports = sequelize;
