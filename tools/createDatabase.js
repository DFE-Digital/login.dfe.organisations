const schema = require("./../src/infrastructure/repository");

const run = async () => {
  try {
    await schema.services.sync();
    await schema.organisations.sync();
    await schema.users.sync();
    await schema.invitations.sync();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

run();
