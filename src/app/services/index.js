'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('../../infrastructure/config/index')();
const getUserAssociatedServices = require('./getUserAssociatedServices');
const getUnassociatedWithUserServices = require('./getUnassociatedWithUserServices');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routed to functions.
  router.get('/associated-with-user/:uid', getUserAssociatedServices);
  router.get('/unassociated-with-user/:uid', getUnassociatedWithUserServices);

  return router;
};

module.exports = routeExport();
