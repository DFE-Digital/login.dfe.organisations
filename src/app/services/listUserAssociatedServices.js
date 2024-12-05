const logger = require("./../../infrastructure/logger");
const { listUserAssociatedServices } = require("./data/servicesStorage");

const extractPageNumber = (req) => {
  if (!req.query || req.query.page === undefined) {
    return 1;
  }

  const pageNumber = parseInt(req.query.page);
  return isNaN(pageNumber) ? 0 : pageNumber;
};
const extractPageSize = (req) => {
  if (!req.query || req.query.pageSize === undefined) {
    return 25;
  }

  const pageSize = parseInt(req.query.pageSize);
  return isNaN(pageSize) ? 0 : pageSize;
};

const action = async (req, res) => {
  const pageNumber = extractPageNumber(req);
  if (pageNumber < 1) {
    return res.status(400).send("page must be greater than 0");
  }

  const pageSize = extractPageSize(req);
  if (pageSize < 1) {
    return res.status(400).send("pageSize must be greater than 0");
  } else if (pageSize > 500) {
    return res.status(400).send("pageSize must not be greater than 500");
  }

  const correlationId = req.header("x-correlation-id");

  try {
    const pageOfResults = await listUserAssociatedServices(
      pageNumber,
      pageSize,
      correlationId,
    );
    return res.contentType("json").send(pageOfResults);
  } catch (e) {
    logger.error(`Error listing user associated services - ${e.message}`);
    return res.status(500).send();
  }
};

module.exports = action;
