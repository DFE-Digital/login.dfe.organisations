const logger = require("./../../infrastructure/logger");
const config = require("./../../infrastructure/config");
const organisationsStorage = require("./data/organisationsStorage");

const extractNumber = (req, key, defaultValue) => {
  if (!req.query || req.query[key] === undefined) return defaultValue;

  const num = parseInt(req.query[key], 10);
  return isNaN(num) ? 0 : num;
};

const getCollectOrgsWithoutActiveUsers = async (req, res) => {
  const correlationId = req.get ? req.get("x-correlation-id") : undefined;

  try {
    const pageNumber = extractNumber(req, "page", 1);
    if (pageNumber < 1)
      return res.status(400).send("Page number must be greater than 0");

    const pageSize = extractNumber(req, "pageSize", 25);
    if (pageSize < 1 || pageSize > 50)
      return res
        .status(400)
        .send("Page size must be between 1 and 50 inclusive");

    const pagedResult =
      await organisationsStorage.pagedListOfCollectOrgsWithoutActiveUsers(
        config.legacyServices.collectServiceId,
        pageNumber,
        pageSize,
      );

    return res.status(200).send(pagedResult);
  } catch (e) {
    logger.error(
      `Error fetching COLLECT orgs without active users - ${e.message}`,
      { correlationId, stack: e.stack },
    );
    return res.status(500).send(e.message || "Server error");
  }
};

module.exports = getCollectOrgsWithoutActiveUsers;
