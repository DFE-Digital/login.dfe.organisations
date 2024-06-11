'use strict';

const config = require('./infrastructure/config')();
const configSchema = require('./infrastructure/config/schema');
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
const helmet = require('helmet');

configSchema.validate();

https.globalAgent.maxSockets = http.globalAgent.maxSockets = config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

const app = express();

const hstsMaxAge = Number(process.env.hstsMaxAge);

app.use(helmet({
  frameguard: {
    action: 'deny'
  },
  // Apply custom sts value if provided else use default
  hsts: {
    maxAge: isNaN(hstsMaxAge) ? 15552000 : hstsMaxAge,
    preload: true
  }
}));

logger.info('set helmet policy defaults');

// Setting helmet Content Security Policy
const scriptSources = ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', '*.localhost', '*.signin.education.gov.uk', 'https://code.jquery.com', 'https://rawgit.com'];

app.use(helmet.contentSecurityPolicy({
  browserSniff: false,
  setAllHeaders: false,
  useDefaults: false,
  directives: {
    defaultSrc: ['\'self\''],
    childSrc: ['none'],
    objectSrc: ['none'],
    scriptSrc: scriptSources,
    styleSrc: ['\'self\'', '*.localhost', '*.signin.education.gov.uk', 'https://rawgit.com', '\'unsafe-inline\''],
    imgSrc: ['\'self\'', 'data:', 'blob:', '*.localhost', '*.signin.education.gov.uk', 'https://rawgit.com', 'https://raw.githubusercontent.com'],
    fontSrc: ['\'self\'', 'data:', '*.signin.education.gov.uk'],
    connectSrc: ['\'self\''],
    formAction: ['\'self\'', '*']
  }
}));

logger.info('Set helmet filters');

app.use(helmet.xssFilter());
app.use(helmet.frameguard('false'));
app.use(helmet.ieNoOpen());

logger.info('helmet setup complete');

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
  logger
}));

if (config.hostingEnvironment.env === 'dev') {
  app.proxy = true;
  const options = {
    key: config.hostingEnvironment.sslKey,
    cert: config.hostingEnvironment.sslCert,
    requestCert: false,
    rejectUnauthorized: false
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`);
  });
}
