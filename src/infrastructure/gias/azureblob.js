const config = require('./../config')();
const rp = require('request-promise');
const { URL } = require('url');

const getFileFromBlob = async (path) => {
  const containerUri = new URL(config.gias.params.containerUrl);
  const uri = `${containerUri.protocol}//${containerUri.host}${containerUri.pathname}/${path}${containerUri.search}`;
  return await rp({
    method: 'GET',
    uri,
    json: false,
  });
};

const getEstablishmentsFile = async (includeLinks = false) => {
  const result = {
    establishments: undefined,
    links: undefined,
  };
  result.establishments = await getFileFromBlob('establishments/import.csv');
  if (includeLinks) {
    result.links = await getFileFromBlob('establishments/links.csv');
  }
  return result;
};

const getGroupsFile = async (includeLinks = false) => {

  const result = {
    groups: undefined,
    links: undefined,
  };
  result.groups = await getFileFromBlob('groups/groups.csv');
  if (includeLinks) {
    result.links = await getFileFromBlob('groups/links.csv');
  }
  return result;
};

module.exports = {
  getEstablishmentsFile,
  getGroupsFile,
};
