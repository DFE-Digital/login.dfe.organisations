'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { deprecate } = require('./../../utils');

const listInvitations = require('./listInvitations');
const getInvitation = require('./getInvitation');
const getInvitationV2 = require('./getInvitationV2');
const putInvitation = require('./putInvitation');
const postMigrateInvitationToUser = require('./migrateInvitationToUser');

const invitationRoutes = () => {
  const router = express.Router();

  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/', asyncWrapper(listInvitations));
  router.get('/:inv_id', deprecate('/invitations/v2/:inv_id'), asyncWrapper(getInvitation));
  router.get('/v2/:inv_id', asyncWrapper(getInvitationV2));
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
  router.put('/:org_id/invitations/:inv_id', asyncWrapper(putInvitation));
  router.put('/:org_id/services/:svc_id/invitations/:inv_id', asyncWrapper(putInvitation));

  return router;
};

module.exports = {
  invitations: invitationRoutes(),
  organisationInvitations: organisationRoutes(),
};
