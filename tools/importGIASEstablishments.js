const { importEstablishments } = require('./../src/app/giasImport');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

const doit = async () => {
  const content = await readFile(process.env.ESTABLISHMENTS_PATH, 'utf8');

  await importEstablishments(content);
};

doit().then(() => console.info('done')).catch(e => console.error(e));