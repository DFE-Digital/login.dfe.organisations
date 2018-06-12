const { getEstablishmentsFile } = require('./../src/infrastructure/gias');
const fs = require('fs');

getEstablishmentsFile(true)
  .then((result) => {
    console.log('done');
    console.log(`establishments: ${result.establishments.length}`);
    console.log(`links: ${result.links.length}`);
  })
  .catch((e) => {
    console.error(e.message);
  });