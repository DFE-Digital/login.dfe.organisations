'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();

const getInvitation = require('./getInvitation');
const putInvitation = require('./putInvitation');
const postMigrateInvitationToUser = require('./migrateInvitationToUser');

const invitationRoutes = () => {
  const router = express.Router();

  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routes to functions.
  router.get('/:inv_id', getInvitation);
  router.post('/:inv_id/migrate-to-user', postMigrateInvitationToUser);
  return router;
};

const organisationRoutes = () => {
  const router = express.Router();

  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routes to functions.
  router.put('/:org_id/services/:svc_id/invitations/:inv_id', putInvitation);

  return router;
};

module.exports = {
  invitations: invitationRoutes(),
  organisationInvitations: organisationRoutes(),
};
