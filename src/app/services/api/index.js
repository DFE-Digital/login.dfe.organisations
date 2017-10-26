'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const getUserAssociatedServices = require('./getUserAssociatedServices');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routed to functions.
   router.get('/associated-with-user/:userId', getUserAssociatedServices);

  return router;
};

module.exports = routeExport();
