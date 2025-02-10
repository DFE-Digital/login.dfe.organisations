const editOrganisation = async (req, res) => {
  console.log("editOrganisation called");
  console.log("req: ", req.body);
  return res.status(201).send();
};

module.exports = editOrganisation;
// const {
//   add,
//   update,
//   getOrgById,
//   getOrgByUrn,
//   getOrgByUid,
//   getOrgByEstablishmentNumber,
//   getOrgByUkprn,
//   getOrgByLegacyId,
//   getOrganisationCategories,
//   getNextOrganisationLegacyId,
// } = require("./data/organisationsStorage");
// const {
//   raiseNotificationThatOrganisationHasChanged,
// } = require("./notifications");

// const validateOrg = async (organisation) => {
//   if (!organisation.category || !organisation.category.id) {
//     return "Category is required";
//   }

//   const validCategories = await getOrganisationCategories();
//   const validCategory = validCategories.find(
//     (x) => x.id === organisation.category.id,
//   );
//   if (!validCategory) {
//     return `Unrecognised category ${organisation.category.id}`;
//   }

//   return null;
// };
// const getExistingOrg = async (organisation) => {
//   let existing;
//   const category = organisation.category ? organisation.category.id : undefined;

//   if (!existing && organisation.legacyId) {
//     existing = await getOrgByLegacyId(organisation.legacyId, category);
//   }
//   if (!existing && organisation.urn) {
//     existing = await getOrgByUrn(organisation.urn, category);
//   }
//   if (!existing && organisation.uid) {
//     existing = await getOrgByUid(organisation.uid, category);
//   }
//   if (
//     !existing &&
//     organisation.category.id === "002" &&
//     organisation.establishmentNumber
//   ) {
//     existing = await getOrgByEstablishmentNumber(
//       organisation.establishmentNumber,
//       category,
//     );
//   }
//   if (!existing && organisation.ukprn) {
//     existing = await getOrgByUkprn(organisation.ukprn, category);
//   }

//   return existing;
// };
// const generateLegacyId = async () => {
//   if (!config.toggles || !config.toggles.generateOrganisationLegacyId) {
//     return undefined;
//   }
//   return await getNextOrganisationLegacyId();
// };

// const action = async (req, res) => {
//   const organisation = getOrgById(req.id);

//   const validationReason = await validateOrg(organisation);
//   if (validationReason) {
//     return res.status(400).send(validationReason);
//   }

//   const existingOrg = await getExistingOrg(organisation);
//   if (existingOrg) {
//     existingOrg.name = organisation.name;
//     existingOrg.legacyId =
//       organisation.legacyId ||
//       existingOrg.legacyId ||
//       (await generateLegacyId());
//     await update(existingOrg);
//     await raiseNotificationThatOrganisationHasChanged(existingOrg.id);

//     return res.status(202).send();
//   }

//   organisation.id = uuid.v4();
//   if (!organisation.legacyId) {
//     organisation.legacyId = await generateLegacyId();
//   }
//   await add(organisation);
//   await raiseNotificationThatOrganisationHasChanged(organisation.id);

//   return res.status(201).send();
// };

// module.exports = action;
