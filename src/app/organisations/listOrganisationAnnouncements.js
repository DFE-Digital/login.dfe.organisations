const { listAnnouncements } = require("./data/organisationsStorage");

const getQueryStringValue = (req, paramName) => {
  const key = Object.keys(req.query || {}).find(
    (x) => x.toLowerCase() === paramName.toLowerCase(),
  );
  if (!key) {
    return undefined;
  }

  return req.query[key];
};
const getNuericQueryStringValue = (req, paramName) => {
  const value = getQueryStringValue(req, paramName);
  if (!value) {
    return undefined;
  }

  const int = parseInt(value);
  if (isNaN(int)) {
    throw new Error(
      `query param ${paramName} must be a number but received ${value}`,
    );
  }
  return int;
};
const getPageNumber = (req) => {
  return getNuericQueryStringValue(req, "page") || 1;
};
const getPageSize = (req) => {
  return getNuericQueryStringValue(req, "pageSize") || 25;
};
const getOnlyPublished = (req) => {
  const value = getQueryStringValue(req, "onlyPublished");
  if (!value) {
    return true;
  }

  switch (value.toLowerCase()) {
    case "true":
    case "yes":
    case "1":
      return true;
    case "false":
    case "no":
    case "0":
      return false;
    default:
      throw new Error(
        `query param onlypublished must be binary (true/yes/1/false/no/0) but received ${value}`,
      );
  }
};

const listOrganisationAnnouncements = async (req, res) => {
  const organisationId = req.params.id;
  let onlyPublishedAnnouncements;
  let pageNumber;
  let pageSize;

  try {
    onlyPublishedAnnouncements = getOnlyPublished(req);
    pageNumber = getPageNumber(req);
    pageSize = getPageSize(req);
  } catch (e) {
    return res.status(400).send({ reason: e.message });
  }

  const pageOfAnnouncements = await listAnnouncements(
    organisationId,
    undefined,
    onlyPublishedAnnouncements,
    pageNumber,
    pageSize,
  );
  return res.json(pageOfAnnouncements);
};
module.exports = listOrganisationAnnouncements;
