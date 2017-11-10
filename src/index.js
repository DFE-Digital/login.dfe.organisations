'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');
const config = require('./infrastructure/config')();
const logger = require('./infrastructure/logger');
const morgan = require('morgan');
const { organisations, services } = require('./app/services');
const { organisationInvitations } = require('./app/invitations');
const dev = require('./app/dev');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
app.use(morgan('dev'));

app.use('/services', services);
app.use('/organisations', organisations);
app.use('/organisations', organisationInvitations);
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
} else {
  app.listen(process.env.PORT, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`);
  });
}
