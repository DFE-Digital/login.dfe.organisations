const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listOrganisations = require('./listOrganisations');
const listCategories = require('./listCategories');
const listStates = require('./listStates');
const listUserOrganisations = require('./listUserOrganisations');
const listInvitationOrganisations = require('./listInvitationOrganisations');
const createOrganisation = require('./createOrganisation');
const getOrganisation = require('./getOrganisation');
const getOrganisationV2 = require('./getOrganisationV2');
const getOrganisationByExternalId = require('./getOrganisationByExternalId');
const getOrganisationsAssociatedWithUser = require('./getOrganisationsAssociatedWithUser');
const getOrganisationsAssociatedWithUserV2 = require('./getOrganisationsAssociatedWithUserV2');
const putUserInOrg = require('./putUserInOrg');
const getUsersAssocatedWithOrganisationsForApproval = require('./getUsersAssociatedWithOrganisationForApproval');
const deleteUserOrganisation = require('./deleteUserOrganisation');
const getUsersForOrganisation = require('./getUsersForOrganisation');
const listOrganisationAnnouncements = require('./listOrganisationAnnouncements');
const upsertOrganisationAnnouncement = require('./upsertOrganisationAnnouncement');
const listAllAnnouncements = require('./listAllAnnouncements');
const createUserOrganisationRequest = require('./createUserOrganisationRequest');
const getUserOrganisationRequest = require('./getUserOrganisationRequest');
const getApproversForOrganisation = require('./getApproversForOrganisation');
const getRequestsForUser = require('./getRequestsForUser');
const getRequestsForOrganisation = require('./getRequestsForOrganisation');

const router = express.Router();

const routes = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/', asyncWrapper(listOrganisations));
  router.get('/categories', asyncWrapper(listCategories));
  router.get('/states', asyncWrapper(listStates));
  router.get('/users', asyncWrapper(listUserOrganisations));
  router.get('/invitations', asyncWrapper(listInvitationOrganisations));
  router.post('/', asyncWrapper(createOrganisation));
  router.get('/announcements', asyncWrapper(listAllAnnouncements));

  router.get('/by-external-id/:type/:id', asyncWrapper(getOrganisationByExternalId));
  router.get('/associated-with-user/:uid', asyncWrapper(getOrganisationsAssociatedWithUser));
  router.get('/v2/associated-with-user/:uid', asyncWrapper(getOrganisationsAssociatedWithUserV2));
  router.get('/users-for-approval/:uid?', asyncWrapper(getUsersAssocatedWithOrganisationsForApproval));
  router.get('/:id/users', asyncWrapper(getUsersForOrganisation));
  router.get('/:id/announcements', asyncWrapper(listOrganisationAnnouncements));
  router.post('/:id/announcements', asyncWrapper(upsertOrganisationAnnouncement));
  router.get('/:id', asyncWrapper(getOrganisation));
  router.get('/v2/:id', asyncWrapper(getOrganisationV2));
  router.put('/:id/users/:uid', asyncWrapper(putUserInOrg));
  router.delete('/:id/users/:uid', asyncWrapper(deleteUserOrganisation));
  router.get('/:id/approvers', asyncWrapper(getApproversForOrganisation));
  router.post('/:id/users/:uid/requests', asyncWrapper(createUserOrganisationRequest));
  router.get('/:id/requests', asyncWrapper(getRequestsForOrganisation));

  router.get('/requests/:rid', asyncWrapper(getUserOrganisationRequest));
  router.get('/requests-for-approval/:uid', asyncWrapper(getRequestsForUser));

  return router;
};

module.exports = routes();
