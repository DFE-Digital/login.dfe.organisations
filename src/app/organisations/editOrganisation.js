const {
  //   add,
  updateOtherStakeholders,
  getOrgById,
} = require("./data/organisationsStorage");

const editOrganisation = async (req, res) => {
  console.log("editOrganisation called");
  console.log("req: ", req.body);
  console.log("params: ", req.params);

  const orgUpdate = {
    id: req.params.id,
    name: req.body.name,
    address: req.body.address,
  };

  const orgId = req.params.id;
  console.log("orgId: ", orgId);
  const org = await getOrgById(orgId);
  console.log("org: ", org);
  await updateOtherStakeholders(orgUpdate);

  return res.status(200).send();
};

module.exports = editOrganisation;
