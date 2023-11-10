'use strict';

const express = require('express');
const listEndpoints = require('express-list-endpoints');

const router = express.Router({ mergeParams: true });
const uuid = require('uuid');
const { partition, flatten } = require('lodash');

const servicesStorage = require('./../services/data/servicesStorage');
const organisationsStorage = require('./../services/data/organisationsStorage');
const invitationsStorage = require('./../invitations/data/invitationsStorage');

const compareNameAttr = (x, y) => {
  if (x.name.toUpperCase() < y.name.toUpperCase()) {
    return -1;
  }
  if (x.name.toUpperCase() > y.name.toUpperCase()) {
    return 1;
  }
  return 0;
};
const innerPartition = (items, keySelector) => {
  const partitioned = [];
  items.forEach((item) => {
    const itemKey = keySelector(item);
    let batch = partitioned.find(x => x.key === itemKey);
    if (!batch) {
      batch = {
        key: itemKey,
        items: [],
      };
      partitioned.push(batch);
    }
    batch.items.push(item);
  });
  return partitioned.map(x => x.items);
};

const listServices = async (req, res) => {
  const services = await servicesStorage.list();
  res.render('dev/views/servicesList', {
    services: services.sort(compareNameAttr),
  });
};
const getCreateServices = (req, res) => {
  res.render('dev/views/serviceEdit', {
    csrfToken: '',
    editorTitle: 'Create service',
    editorAction: 'Create',
    editorItem: {
      id: '[New]',
      name: '',
      description: '',
    },
  });
};
const postCreateServices = async (req, res) => {
  const id = uuid.v4();
  const name = req.body.name;
  const description = req.body.description || '';

  await servicesStorage.create(id, name, description);

  res.redirect('/manage/services');
};
const getEditServices = async (req, res) => {
  const service = await servicesStorage.getById(req.params.id);
  if (!service) {
    res.status(404).send();
  }

  res.render('dev/views/serviceEdit', {
    csrfToken: '',
    editorTitle: 'Edit service',
    editorAction: 'Update',
    editorItem: service,
  });
};
const postEditServices = async (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const description = req.body.description || '';

  await servicesStorage.update(id, name, description);

  res.redirect('/manage/services');
};

const listOrganisations = async (req, res) => {
  const organisations = await organisationsStorage.list();
  res.render('dev/views/organisationsList', {
    organisations: organisations.sort(compareNameAttr),
  });
};
const getCreateOrganisation = (req, res) => {
  res.render('dev/views/organisationEdit', {
    csrfToken: '',
    editorTitle: 'Create organisation',
    editorAction: 'Create',
    editorItem: {
      id: '[New]',
      name: '',
      description: '',
    },
  });
};
const postCreateOrganisation = async (req, res) => {
  const id = uuid.v4();
  const name = req.body.name;

  await organisationsStorage.createOrg(id, name);

  res.redirect('/manage/organisations');
};
const getEditOrganisation = async (req, res) => {
  const organisation = await organisationsStorage.getOrgById(req.params.id);
  if (!organisation) {
    res.status(404).send();
  }

  res.render('dev/views/organisationEdit', {
    csrfToken: '',
    editorTitle: 'Edit organisation',
    editorAction: 'Update',
    editorItem: organisation,
  });
};
const postEditOrganisation = async (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  await organisationsStorage.updateOrg(id, name);

  res.redirect('/manage/organisations');
};

const seedUserServices = async (req, res) => {
  const services = await servicesStorage.list();
  const orgs = await organisationsStorage.list();

  res.render('dev/views/seedUserServices', {
    csrfToken: '',
    services: services.sort(compareNameAttr),
    organisations: orgs.sort(compareNameAttr),
  });
};
const postSeedUserServices = async (req, res) => {
  const userId = req.body.user_id;
  const organisationId = req.body.organisation_id;
  const serviceId = req.body.service_id;
  const roleId = req.body.role_id;
  const status = req.body.status;

  await servicesStorage.upsertServiceUser({
    id: uuid.v4(),
    userId,
    organisationId,
    serviceId,
    roleId,
    status,
  });

  res.redirect('/manage');
};
const listUserServices = async (req, res) => {
  const services = await servicesStorage.list();
  const organisations = await organisationsStorage.list();

  const allUserAccess = flatten(await Promise.all(services.map(async (service) => {
    const usersOfService = await Promise.all(organisations.map(async (organisation) => {
      const usersOfServiceByOrg = await servicesStorage.getUsersOfService(organisation.id, service.id);
      return usersOfServiceByOrg.map(user => ({
        userId: user.id,
        service,
        organisation,
        role: user.role,
      }));
    }));
    return flatten(usersOfService);
  })));

  const users = partition(allUserAccess, item => item.userid).filter(item => item.length > 0).map(item => ({
    id: item[0].userId,
    access: item,
  }));

  res.render('dev/views/userAccessList', {
    users,
  });
};

const listInvitationServices = async (req, res) => {
  const invitations = await invitationsStorage.list();

  let groupedInvitations = innerPartition(invitations, item => item.invitationId);
  groupedInvitations = groupedInvitations.filter(item => item.length > 0).map(item => ({
    id: item[0].invitationId,
    access: item,
  }));

  res.render('dev/views/invitationsList', {
    invitations: groupedInvitations,
  });
};
const getLinkInvitation = async (req, res) => {
  const services = await servicesStorage.list();
  const orgs = await organisationsStorage.list();

  res.render('dev/views/invitationsLink', {
    csrfToken: '',
    services: services.sort(compareNameAttr),
    organisations: orgs.sort(compareNameAttr),
  });
};
const postLinkInvitation = async (req, res) => {
  const invitationId = req.body.invitation_id;
  const organisationId = req.body.organisation_id;
  const serviceId = req.body.service_id;
  const roleId = req.body.role_id;

  await invitationsStorage.upsert({
    invitationId,
    organisationId,
    serviceId,
    roleId,
  });

  res.redirect('/manage');
};

const routes = () => {
  router.get('/', (req, res) => {
    const routeList = listEndpoints(req.app);
    res.render('dev/views/launch', { routes: routeList });
  });

  router.get('/services', listServices);
  router.get('/services/new', getCreateServices);
  router.post('/services/new', postCreateServices);
  router.get('/services/:id', getEditServices);
  router.post('/services/:id', postEditServices);

  router.get('/organisations', listOrganisations);

  router.get('/organisations/new', getCreateOrganisation);
  router.post('/organisations/new', postCreateOrganisation);
  router.get('/organisations/:id', getEditOrganisation);
  router.post('/organisations/:id', postEditOrganisation);

  router.get('/seed-user-services', seedUserServices);
  router.post('/seed-user-services', postSeedUserServices);
  router.get('/user-access', listUserServices);

  router.get('/invitation-access', listInvitationServices);
  router.get('/invitation-access/link', getLinkInvitation);
  router.post('/invitation-access/link', postLinkInvitation);

  return router;
};

module.exports = routes;
