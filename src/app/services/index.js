'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const getUserAssociatedServices = require('./getUserAssociatedServices');
const getUnassociatedWithUserServices = require('./getUserUnassociatedServices');
const getServiceDetails = require('./getServiceDetails');
const getServiceUsers = require('./getServiceUsers');
const getUserRequestForApproval = require('./getUserRequestForApproval');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routed to functions.
  router.get('/associated-with-user/:uid', getUserAssociatedServices);
  router.get('/unassociated-with-user/:uid', getUnassociatedWithUserServices);
  router.get('/:sid/users', getServiceUsers);
  router.get('/:sid', getServiceDetails);
  router.get('/:usid/request', getUserRequestForApproval);

  return router;
};

module.exports = routeExport();
