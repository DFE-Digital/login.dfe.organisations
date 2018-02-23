const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const listOrganisations = require('./listOrganisations');

const router = express.Router();

const routes = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/', listOrganisations);

  return router;
};

module.exports = routes();
