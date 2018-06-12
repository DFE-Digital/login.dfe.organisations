const { getEstablishmentsFile } = require('./../src/infrastructure/gias');
const fs = require('fs');

getEstablishmentsFile()
  .then((csv) => {
    console.log('done');
  })
  .catch((e) => {
    console.error(e.message);
  });