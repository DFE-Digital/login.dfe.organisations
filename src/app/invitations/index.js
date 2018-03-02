'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getInvitation = require('./getInvitation');
const putInvitation = require('./putInvitation');
const postMigrateInvitationToUser = require('./migrateInvitationToUser');

const invitationRoutes = () => {
  const router = express.Router();

  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/:inv_id', asyncWrapper(getInvitation));
  router.post('/:inv_id/migrate-to-user', asyncWrapper(postMigrateInvitationToUser));
  return router;
};

const organisationRoutes = () => {
  const router = express.Router();

  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routes to functions.
  router.put('/:org_id/services/:svc_id/invitations/:inv_id', asyncWrapper(putInvitation));

  return router;
};

module.exports = {
  invitations: invitationRoutes(),
  organisationInvitations: organisationRoutes(),
};
