const { getExtract } = require('./../src/infrastructure/gias/webService');

getExtract(13882)
  .then(() => {
    console.log('done');
  })
  .catch((e) => console.error(e.message));