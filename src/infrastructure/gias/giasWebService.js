const config = require('./../config')();
const { getExtract, getGroupsExtract } = require('./webService');
const { ReadableStream } = require('memory-streams');
const unzipper = require('unzipper');

const extractFilesFromZip = async (zipContent, attachmentNames) => {
  return new Promise((resolve, reject) => {
    const input = new ReadableStream(zipContent);
    const files = [];
    input
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        if (attachmentNames.find(x => x === entry.path)) {
          entry.buffer().then((content) => {
            files.push({
              name: entry.path,
              content,
            });
          });
        } else {
          entry.autodrain();
        }
      })
      .on('error', (e) => {
        reject(e);
      })
      .on('finish', () => {
        resolve(files);
      });
  });
};

const getEstablishmentsFile = async (includeLinks = false) => {
  const extract = await getExtract(config.gias.params.establishmentExtractId);
  const files = await extractFilesFromZip(extract.content, includeLinks ? ['import.csv', 'links.csv'] : ['import.csv']);

  const establishments = files.find(x => x.name === 'import.csv');
  const links = files.find(x => x.name === 'links.csv');

  return {
    establishments: establishments ? establishments.content.toString('utf8') : undefined,
    links: links ? links.content.toString('utf8') : undefined,
  };
};

const getGroupsFile = async (includeLinks = false) => {
  const extract = await getGroupsExtract(config.gias.params.establishmentExtractId);
  const files = await extractFilesFromZip(extract.content, includeLinks ? ['groups.csv', 'links.csv'] : ['groups.csv']);

  const groups = files.find(x => x.name === 'groups.csv');
  const links = files.find(x => x.name === 'links.csv');

  return {
    groups: groups ? groups.content.toString('utf8') : undefined,
    links: links ? links.content.toString('utf8') : undefined,
  };
};

module.exports = {
  getEstablishmentsFile,
  getGroupsFile,
};
