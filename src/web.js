'use strict';

const config = require('./infrastructure/config')();
const logger = require('./infrastructure/logger');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');
const services = require('./app/services');
const organisations = require('./app/organisations');
const { organisationInvitations, invitations } = require('./app/invitations');
const dev = require('./app/dev');
const healthCheck = require('login.dfe.healthcheck');
const { getErrorHandler } = require('login.dfe.express-error-handling');
const KeepAliveAgent = require('agentkeepalive');

const { organisationsSchema, validateConfig } = require('login.dfe.config.schema');

validateConfig(organisationsSchema, config, logger, config.hostingEnvironment.env !== 'dev');

http.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});
https.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use('/healthcheck', healthCheck({ config }));
app.use('/services', services.services);
app.use('/organisations', organisations);
app.use('/organisations', services.organisations);
app.use('/organisations', organisationInvitations);
app.use('/invitations', invitations);

if (config.hostingEnvironment.useDevViews) {
  app.use(expressLayouts);
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));
  app.set('layout', 'layouts/layout');

  app.use('/manage', dev());

  app.get('/', (req, res) => {
    res.redirect('/manage');
  });
}

app.use(getErrorHandler({
  logger,
}));

if (config.hostingEnvironment.env === 'dev') {
  app.proxy = true;
  const options = {
    key: config.hostingEnvironment.sslKey,
    cert: config.hostingEnvironment.sslCert,
    requestCert: false,
    rejectUnauthorized: false,
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
} else if (config.hostingEnvironment.env === 'docker') {
  app.listen(config.hostingEnvironment.port, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`);
  });
}
