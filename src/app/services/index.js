'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../infrastructure/config')();
const getUserAssociatedServices = require('./getUserAssociatedServices');
const getUnassociatedWithUserServices = require('./getUserUnassociatedServices');
const getServiceDetails = require('./getServiceDetails');
const getServiceUsers = require('./getServiceUsers');
const getUserRequestForApproval = require('./getUserRequestForApproval');
const getApproversOfService = require('./getApproversOfService');
const getServiceById = require('./getServiceById');
const getSingleServiceIdentifier = require('./getSingleServiceIdentifier');
const putSingleServiceIdentifier = require('./putSingleServiceIdentifier');

const router = express.Router();

const servicesRouteExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }
  // Map routed to functions.
  router.get('/:sid', getServiceById);
  router.get('/:sid/identifiers/:id_key/:id_value', getSingleServiceIdentifier);
  router.get('/associated-with-user/:uid', getUserAssociatedServices);
  router.get('/unassociated-with-user/:uid', getUnassociatedWithUserServices);
  return router;
};


const organisationsRouteExport = () => {
  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }
  router.get('/:org_id/services/:sid', getServiceDetails);
  router.get('/:org_id/services/:sid/request/:uid', getUserRequestForApproval);
  router.get('/:org_id/services/:sid/users', getServiceUsers);
  router.get('/:org_id/services/:sid/approvers', getApproversOfService);
  router.put('/:org_id/services/:sid/identifiers/:uid', putSingleServiceIdentifier);
  return router;
};

module.exports = {
  services: servicesRouteExport(),
  organisations: organisationsRouteExport(),
};
