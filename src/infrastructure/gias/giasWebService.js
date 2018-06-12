const config = require('./../config')();
const { getExtract } = require('./webService');
const { ReadableStream } = require('memory-streams');
const unzipper = require('unzipper');

const extractFileFromZip = async (zipContent, attachmentName) => {
  return new Promise((resolve, reject) => {
    const input = new ReadableStream(zipContent);
    let hasResolved = false;
    input
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        if (entry.path === attachmentName) {
          entry.buffer().then((content) => {
            hasResolved = true;
            resolve(content);
          });
        } else {
          entry.autodrain();
        }
      })
      .on('error', (e) => {
        reject(e);
      })
      .on('finish', () => {
        if (!hasResolved) {
          resolve(undefined);
        }
      });
  });
};
const getEstablishmentsAndExtractAttachment = async (attachmentName) => {
  const extract = await getExtract(config.gias.params.establishmentExtractId);
  const buffer = await extractFileFromZip(extract.content, attachmentName);
  return buffer.toString('utf8');
};

const getEstablishmentsFile = async () => {
  return getEstablishmentsAndExtractAttachment('import.csv');
};

const getEstablishmentsLinksFile = async () => {
  return getEstablishmentsAndExtractAttachment('links.csv');
};

const getGroupsFile = async () => {
  return Promise.resolve(null);
};

const getGroupsLinksFile = async () => {
  return Promise.resolve(null);
};

module.exports = {
  getEstablishmentsFile,
  getEstablishmentsLinksFile,
  getGroupsFile,
  getGroupsLinksFile,
};
