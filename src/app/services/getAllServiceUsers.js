const logger = require("./../../infrastructure/logger");
const servicesStorage = require("./data/servicesStorage");

const isFutureDate = (inputDate) => {
  return inputDate.getTime() > new Date().getTime();
};

const isUuid = (value) =>
  value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const extractPageNumber = (req) => {
  const paramsSource = req.method === "POST" ? req.body : req.query;
  if (!paramsSource || paramsSource.page === undefined) {
    return 1;
  }

  const pageNumber = parseInt(paramsSource.page);
  return isNaN(pageNumber) ? 0 : pageNumber;
};
const extractPageSize = (req) => {
  const paramsSource = req.method === "POST" ? req.body : req.query;
  if (!paramsSource || paramsSource.pageSize === undefined) {
    return 25;
  }

  const pageSize = parseInt(paramsSource.pageSize);
  return isNaN(pageSize) ? 0 : pageSize;
};

const getAllServiceUsers = async (req, res) => {
  const serviceId = req.params.sid ? req.params.sid.toLowerCase() : "";

  if (!isUuid(serviceId)) {
    res.status(404).send();
    return;
  }

  try {
    const service = await servicesStorage.getById(
      serviceId,
      req.header("x-correlation-id"),
    );
    if (!service) {
      res.status(404).send();
      return;
    }

    const pageNumber = extractPageNumber(req);
    if (pageNumber < 1) {
      res.status(400).send("page must be greater than 0");
      return;
    }

    const pageSize = extractPageSize(req);
    if (pageSize < 1) {
      res.status(400).send("pageSize must be greater than 0");
      return;
    } else if (pageSize > 1000) {
      res.status(400).send("pageSize must not be greater than 1000");
      return;
    }

    let userIds;
    const paramSource = req.method === "POST" ? req.body : req.query;
    if (paramSource && paramSource.userIds) userIds = req.body.userIds;

    const status = paramSource.status;
    const from = paramSource.from;
    const to = paramSource.to;

    if (status && status !== 1 && status !== 0) {
      res.status(400).send("status must be 1 or 0");
      return;
    }

    let fromDate;
    let toDate;
    if (to && isNaN(Date.parse(to))) {
      return res.status(400).send("to date is not a valid date");
    } else if (to) {
      toDate = new Date(to);
    }
    if (from && isNaN(Date.parse(from))) {
      return res.status(400).send("from date is not a valid date");
    } else if (from) {
      fromDate = new Date(from);
    }

    if (fromDate && toDate) {
      if (isFutureDate(fromDate) && isFutureDate(toDate)) {
        return res.status(400).send("date range should not be in the future");
      } else if (fromDate.getTime() > toDate.getTime()) {
        return res.status(400).send("from date greater than to date");
      }
    } else if (fromDate || toDate) {
      const selectedDate = fromDate ? fromDate : toDate;
      if (isFutureDate(selectedDate)) {
        return res.status(400).send("date range should not be in the future");
      }
    }

    const usersOfService = await servicesStorage.getUsersOfServiceByUserIds(
      serviceId,
      userIds,
      status,
      fromDate,
      toDate,
      pageNumber,
      pageSize,
      req.header("x-correlation-id"),
    );

    res.status(200).send(usersOfService);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = getAllServiceUsers;
