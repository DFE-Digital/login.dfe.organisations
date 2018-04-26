const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listOrganisations = require('./listOrganisations');
const getOrganisation = require('./getOrganisation');
const getOrganisationByExternalId = require('./getOrganisationByExternalId');

const router = express.Router();

const routes = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/', asyncWrapper(listOrganisations));
  router.get('/:id', asyncWrapper(getOrganisation));
  router.get('/by-external-id/:type/:id', asyncWrapper(getOrganisationByExternalId))

  return router;
};

module.exports = routes();
