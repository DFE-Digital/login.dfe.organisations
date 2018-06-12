const { getGroupsExtract } = require('./../src/infrastructure/gias/webService');
const fs = require('fs');

getGroupsExtract()
  .then((result) => {
    fs.writeFileSync('./groups.zip', result.content);
    console.log('done');
  })
  .catch((e) => console.error(e.message));