'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('../../infrastructure/config/index')();
// const getUserAssociatedServices = require('./getUserAssociatedServices');
const unassociatedWithUser = require('./unassociatedWithUser');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routed to functions.
  // router.get('/:userId', getUserAssociatedServices);
  router.get('/unassociatedWithUser/:userId', unassociatedWithUser);

  return router;
};

module.exports = routeExport();
