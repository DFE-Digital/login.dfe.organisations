const config = require('./../config')();

let adapter;
if (config.gias.type === 'azureblob') {
  adapter = require('./azureblob');
} else if (config.gias.type === 'gias') {
  adapter = require('./giasWebService');
} else {
  adapter = require('./static');
}

module.exports = adapter;
