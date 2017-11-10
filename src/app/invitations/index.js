'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();

const putInvitation = require('./putInvitation');

const router = express.Router();

const organisationRoutes = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routes to functions.
  // router.get('/associated-with-user/:uid', getUserAssociatedServices);
  // router.get('/unassociated-with-user/:uid', getUnassociatedWithUserServices);

  router.put('/:org_id/services/:svc_id/invitations/:inv_id', putInvitation);

  return router;
};

module.exports = {
  organisationInvitations: organisationRoutes,
};
