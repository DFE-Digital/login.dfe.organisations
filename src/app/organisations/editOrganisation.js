const { updateOtherStakeholders } = require("./data/organisationsStorage");

const editOrganisation = async (req, res) => {
  const orgUpdate = {
    id: req.params.id,
    name: req.body.name,
    address: req.body.address,
  };

  await updateOtherStakeholders(orgUpdate);

  return res.status(200).send();
};

module.exports = editOrganisation;
