const { importGroups } = require("./../src/app/giasImport");

const doit = async () => {
  await importGroups();
};

doit()
  .then(() => console.info("done"))
  .catch((e) => console.error(e));
