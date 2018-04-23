const config = require('./../config')();

let adapter;
if (config.gias.type === 'azureblob') {
  adapter = require('./azureblob');
} else {
  adapter = require('./static');
}

module.exports = adapter;
