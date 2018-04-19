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

const getEstablishmentsFile = async () => {
  return await getFileFromBlob('establishments/import.csv');
};

const getEstablishmentsLinksFile = async () => {
  return await getFileFromBlob('establishments/links.csv');
};

const getGroupsFile = async () => {
  return await getFileFromBlob('groups/groups.csv');
};

const getGroupsLinksFile = async () => {
  return await getFileFromBlob('groups/links.csv');
};

module.exports = {
  getEstablishmentsFile,
  getEstablishmentsLinksFile,
  getGroupsFile,
  getGroupsLinksFile,
};
