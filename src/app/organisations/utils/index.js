const config = require('./../../../infrastructure/config')();
const { getUserOrganisationByTextIdentifier, getNextUserOrgNumericIdentifier, getOrganisationsAssociatedToUser } = require('./../data/organisationsStorage');
const { encodeNumberToString } = require('./../../../utils');

const getUserOrganisationIdentifiers = async (userId, organisationId, definedNumericIdentifier, definedTextIdentifier) => {
  let numericIdentifier = definedNumericIdentifier;
  let textIdentifier = definedTextIdentifier;
  const userOrgs = (!numericIdentifier || !textIdentifier ? await getOrganisationsAssociatedToUser(userId) : []) || [];
  const existingUserOrg = userOrgs.find(uo => uo.organisation.id.toLowerCase() === organisationId.toLowerCase());

  if (!numericIdentifier && existingUserOrg) {
    numericIdentifier = existingUserOrg.numericIdentifier;
  }
  if (!numericIdentifier && config.toggles && config.toggles.generateUserOrgIdentifiers) {
    numericIdentifier = await getNextUserOrgNumericIdentifier();
  }

  if (!textIdentifier && existingUserOrg) {
    textIdentifier = existingUserOrg.textIdentifier;
  }
  if (!textIdentifier && config.toggles && config.toggles.generateUserOrgIdentifiers) {
    const options = encodeNumberToString(numericIdentifier);
    let current;
    let index = 1;
    let inUse = false;
    while ((!current || inUse) && index <= 5) {
      current = options[`option${index}`];
      const exiting = await getUserOrganisationByTextIdentifier(current);
      inUse = exiting && !(exiting.user_id === userId && exiting.organisation_id === organisationId);
      index += 1;
    }
    if (inUse) {
      throw new Error(`No textIdentifier options for numeric identifier ${numericIdentifier} are unused`);
    }
    textIdentifier = current;
  }

  return {
    numericIdentifier,
    textIdentifier,
  };
};

module.exports = {
  getUserOrganisationIdentifiers,
};
