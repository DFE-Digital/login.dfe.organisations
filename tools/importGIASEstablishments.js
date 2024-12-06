const { importEstablishments } = require("./../src/app/giasImport");

const doit = async () => {
  await importEstablishments();
};

doit()
  .then(() => console.info("done"))
  .catch((e) => console.error(e));
