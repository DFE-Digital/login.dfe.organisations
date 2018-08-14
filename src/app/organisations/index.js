const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listOrganisations = require('./listOrganisations');
const listCategories = require('./listCategories');
const listStates = require('./listStates');
const createOrganisation = require('./createOrganisation');
const getOrganisation = require('./getOrganisation');
const getOrganisationByExternalId = require('./getOrganisationByExternalId');
const getOrganisationsAssociatedWithUser = require('./getOrganisationsAssociatedWithUser');
const putUserInOrg = require('./putUserInOrg');
const getUsersAssocatedWithOrganisationsForApproval = require('./getUsersAssociatedWithOrganisationForApproval');
const deleteUserOrganisation = require('./deleteUserOrganisation');

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
  router.post('/', asyncWrapper(createOrganisation));

  router.get('/by-external-id/:type/:id', asyncWrapper(getOrganisationByExternalId));
  router.get('/associated-with-user/:uid', asyncWrapper(getOrganisationsAssociatedWithUser));
  router.get('/users-for-approval/:uid?', asyncWrapper(getUsersAssocatedWithOrganisationsForApproval));
  router.get('/:id', asyncWrapper(getOrganisation));
  router.put('/:id/users/:uid', asyncWrapper(putUserInOrg));
  router.delete('/:id/users/:uid', asyncWrapper(deleteUserOrganisation));

  return router;
};

module.exports = routes();
