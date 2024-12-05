const { list } = require("./data/servicesStorage");

const listServices = async (req, res) => {
  const services = await list(req.get("x-correlation-id"));

  return res.contentType("json").send(services);
};

module.exports = listServices;
