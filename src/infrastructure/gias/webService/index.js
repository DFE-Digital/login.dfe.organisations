const config = require('./../../config')();
const SoapMessage = require('./SoapMessage');
const MultipartMessage = require('./MultipartMessage');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('request-promise').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});
const { parseString, processors } = require('xml2js');
const { promisify } = require('util');

const parseXml = promisify(parseString);

const getExtract = async (id) => {
  const requestMessage = new SoapMessage('GetExtract', { Id: id })
    .setUsernamePassword(config.gias.params.username, config.gias.params.password).setMessageExpiry(10000).toXmlString();
  const response = await rp({
    method: 'POST',
    uri: config.gias.params.webserviceUrl,
    headers: {
      'content-type': 'text/xml;charset=UTF-8',
      SOAPAction: 'http://ws.edubase.texunatech.com/GetExtract',
    },
    body: requestMessage,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const responseMessage = MultipartMessage.parse(response.body, MultipartMessage.getBoundaryIdFromResponse(response));
  const soapResponse = await parseXml(responseMessage.parts[0].content, {
    tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase],
    explicitArray: false,
  });

  const attachmentId = soapResponse.envelope.body.getExtractResponse.extract.include.$.href.substr(4).replace('%40', '@');
  const attachment = responseMessage.parts.find(x => x.id === attachmentId);

  return {
    createdAt: new Date(soapResponse.envelope.header.security.timestamp.created),
    expiresAt: new Date(soapResponse.envelope.header.security.timestamp.expires),
    content: attachment.content,
  };
};

const getGroupsExtract = async () => {
  const requestMessage = new SoapMessage('GetGroupExtract')
    .setUsernamePassword(config.gias.params.username, config.gias.params.password).setMessageExpiry(10000).toXmlString();
  const response = await rp({
    method: 'POST',
    uri: config.gias.params.webserviceUrl,
    headers: {
      'content-type': 'text/xml;charset=UTF-8',
      SOAPAction: 'http://ws.edubase.texunatech.com/GetGroupExtract',
    },
    body: requestMessage,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const responseMessage = MultipartMessage.parse(response.body, MultipartMessage.getBoundaryIdFromResponse(response));
  const soapResponse = await parseXml(responseMessage.parts[0].content, {
    tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase],
    explicitArray: false,
  });

  const attachmentId = soapResponse.envelope.body.getGroupExtractResponse.extract.include.$.href.substr(4).replace('%40', '@');
  const attachment = responseMessage.parts.find(x => x.id === attachmentId);

  return {
    createdAt: new Date(soapResponse.envelope.header.security.timestamp.created),
    expiresAt: new Date(soapResponse.envelope.header.security.timestamp.expires),
    content: attachment.content,
  };
};

module.exports = {
  getExtract,
  getGroupsExtract,
};
