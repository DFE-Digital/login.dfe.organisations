const config = require("./../config")();
const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const getUserById = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const user = await fetchApi(
      `${config.directories.service.url}/users/${uid}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );

    return user;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const getUsersByIds = async (ids) => {
  if (!ids) {
    return undefined;
  }
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    const users = await fetchApi(
      `${config.directories.service.url}/users/by-ids`,
      {
        method: "POST",
        body: { ids },
        headers: {
          authorization: `bearer ${token}`,
        },
      },
    );
    return users;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  getUserById,
  getUsersByIds,
};
