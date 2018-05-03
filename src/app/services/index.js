'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getUserAssociatedServices = require('./getUserAssociatedServices');
const getUnassociatedWithUserServices = require('./getUserUnassociatedServices');
const getServiceDetails = require('./getServiceDetails');
const getServiceUsers = require('./getServiceUsers');
const getUserRequestForApproval = require('./getUserRequestForApproval');
const getApproversOfService = require('./getApproversOfService');
const getServiceById = require('./getServiceById');
const getSingleServiceIdentifier = require('./getSingleServiceIdentifier');
const putSingleServiceIdentifier = require('./putSingleServiceIdentifier');
const postServiceUser = require('./postServiceUser');

const router = express.Router();

const servicesRouteExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  // Map routed to functions.
  router.get('/:sid', asyncWrapper(getServiceById));
  router.get('/:sid/identifiers/:id_key/:id_value', asyncWrapper(getSingleServiceIdentifier));
  router.get('/associated-with-user/:uid', asyncWrapper(getUserAssociatedServices));
  router.get('/unassociated-with-user/:uid', asyncWrapper(getUnassociatedWithUserServices));

  return router;
};


const organisationsRouteExport = () => {
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  router.get('/:org_id/services/:sid', asyncWrapper(getServiceDetails));
  router.get('/:org_id/services/:sid/request/:uid', asyncWrapper(getUserRequestForApproval));
  router.get('/:org_id/services/:sid/users', asyncWrapper(getServiceUsers));
  router.get('/:org_id/services/:sid/approvers', asyncWrapper(getApproversOfService));
  router.put('/:org_id/services/:sid/identifiers/:uid', asyncWrapper(putSingleServiceIdentifier));
  router.post('/:ext_org_id/services/:sid/create/:uid', asyncWrapper(postServiceUser));

  return router;
};

module.exports = {
  services: servicesRouteExport(),
  organisations: organisationsRouteExport(),
};
