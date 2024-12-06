const { getOrganisationCategories } = require("./data/organisationsStorage");

const listCategories = async (req, res) => {
  const categories = await getOrganisationCategories();
  return res.contentType("json").send(categories);
};

module.exports = listCategories;
