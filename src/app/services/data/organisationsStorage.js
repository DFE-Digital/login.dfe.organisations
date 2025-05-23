const { organisations } = require("./../../../infrastructure/repository");
const {
  list,
  getOrgById,
  getOrgByUrn,
  getOrgByUid,
  getOrgByEstablishmentNumber,
  getOrgByUpin,
  getOrgByUkprn,
  getOrgByLegacyId,
} = require("./../../organisations/data/organisationsStorage");

const updateOrg = async (id, name) => {
  const org = await getOrgById(id);
  await org.update({ name });
};

const createOrg = async (id, name) => {
  await organisations.create({
    id,
    name,
  });
};

module.exports = {
  list,
  getOrgById,
  updateOrg,
  createOrg,
  getOrgByUrn,
  getOrgByUid,
  getOrgByEstablishmentNumber,
  getOrgByUpin,
  getOrgByUkprn,
  getOrgByLegacyId,
};
