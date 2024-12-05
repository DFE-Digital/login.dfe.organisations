const express = require("express");
const apiAuth = require("login.dfe.api.auth");
const config = require("./../../infrastructure/config")();
const { asyncWrapper } = require("login.dfe.express-error-handling");
const { deprecate } = require("./../../utils");

const listServices = require("./listServices");
const listUserAssociatedServices = require("./listUserAssociatedServices");
const getUserAssociatedServices = require("./getUserAssociatedServices");
const getUnassociatedWithUserServices = require("./getUserUnassociatedServices");
const getServiceDetails = require("./getServiceDetails");
const getServiceUsers = require("./getServiceUsers");
const getUserRequestForApproval = require("./getUserRequestForApproval");
const getApproversOfService = require("./getApproversOfService");
const getServiceById = require("./getServiceById");
const getSingleServiceIdentifier = require("./getSingleServiceIdentifier");
const putSingleServiceIdentifier = require("./putSingleServiceIdentifier");
const postServiceUser = require("./postServiceUser");
const putUserService = require("./putUserService");
const deleteUserAccess = require("./deleteUserService");
const getAllServiceUsers = require("./getAllServiceUsers");

const router = express.Router();

const servicesRouteExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== "dev") {
    router.use(apiAuth(router, config));
  }

  // Map routed to functions.
  router.get("/", asyncWrapper(listServices));
  router.get("/associated-with-user", asyncWrapper(listUserAssociatedServices));
  router.get("/:sid", asyncWrapper(getServiceById));
  router.get(
    "/:sid/identifiers/:id_key/:id_value",
    asyncWrapper(getSingleServiceIdentifier),
  );
  router.get(
    "/associated-with-user/:uid",
    asyncWrapper(getUserAssociatedServices),
  );
  router.get(
    "/unassociated-with-user/:uid",
    asyncWrapper(getUnassociatedWithUserServices),
  );
  router.get("/:sid/users", asyncWrapper(getAllServiceUsers));
  router.post("/:sid/users", asyncWrapper(getAllServiceUsers));

  return router;
};

const organisationsRouteExport = () => {
  if (config.hostingEnvironment.env !== "dev") {
    router.use(apiAuth(router, config));
  }

  router.get("/:org_id/services/:sid", asyncWrapper(getServiceDetails));
  router.get(
    "/:org_id/services/:sid/request/:uid",
    asyncWrapper(getUserRequestForApproval),
  );
  router.get("/:org_id/services/:sid/users", asyncWrapper(getServiceUsers));
  router.get(
    "/:org_id/services/:sid/approvers",
    asyncWrapper(getApproversOfService),
  );
  router.put(
    "/:org_id/services/:sid/identifiers/:uid",
    asyncWrapper(putSingleServiceIdentifier),
  );
  router.post(
    "/:ext_org_id/services/:sid/create/:uid",
    deprecate("/organisations/:org_id/services/:sid/users/:uid"),
    asyncWrapper(postServiceUser),
  );
  router.put("/:org_id/services/:sid/users/:uid", asyncWrapper(putUserService));
  router.delete(
    "/:org_id/services/:sid/users/:uid",
    asyncWrapper(deleteUserAccess),
  );

  return router;
};

module.exports = {
  services: servicesRouteExport(),
  organisations: organisationsRouteExport(),
};
