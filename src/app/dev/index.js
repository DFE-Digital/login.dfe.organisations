'use strict';

const express = require('express');

const router = express.Router({ mergeParams: true });
const uuid = require('uuid/v4');
const { partition, flatten } = require('lodash');

const ServicesStorage = require('./../services/data/servicesStorage');
const OrganisationsStorage = require('./../services/data/organisationsStorage');
const InvitationsStorage = require('./../invitations/data/invitationsStorage');

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
    let batch = partitioned.find((x) => x.key === itemKey);
    if (!batch) {
      batch = {
        key: itemKey,
        items: [],
      };
      partitioned.push(batch);
    }
    batch.items.push(item);
  });
  return partitioned.map((x) => x.items);
};

const listServices = async (req, res) => {
  const storage = new ServicesStorage();
  const services = await storage.list();
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
  const id = uuid();
  const name = req.body.name;
  const description = req.body.description || '';

  const storage = new ServicesStorage();
  await storage.create(id, name, description);

  res.redirect('/manage/services');
};
const getEditServices = async (req, res) => {
  const storage = new ServicesStorage();
  const service = await storage.getById(req.params.id);
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

  const storage = new ServicesStorage();
  await storage.update(id, name, description);

  res.redirect('/manage/services');
};

const listOrganisations = async (req, res) => {
  const storage = new OrganisationsStorage();
  const organisations = await storage.list();
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
  const id = uuid();
  const name = req.body.name;

  const storage = new OrganisationsStorage();
  await storage.createOrg(id, name);

  res.redirect('/manage/organisations');
};
const getEditOrganisation = async (req, res) => {
  const storage = new OrganisationsStorage();
  const organisation = await storage.getOrgById(req.params.id);
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

  const storage = new OrganisationsStorage();
  await storage.updateOrg(id, name);

  res.redirect('/manage/organisations');
};

const seedUserServices = async (req, res) => {
  const storage = new ServicesStorage();
  const orgStorage = new OrganisationsStorage();
  const services = await storage.list();
  const orgs = await orgStorage.list();

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

  const storage = new ServicesStorage();
  await storage.upsertServiceUser({
    id: uuid(),
    userId,
    organisationId,
    serviceId,
    roleId,
    status,
  });

  res.redirect('/manage');
};
const listUserServices = async (req, res) => {
  const storage = new ServicesStorage();
  const services = await storage.list();
  const orgStorage = new OrganisationsStorage();
  const organisations = await orgStorage.list();

  const allUserAccess = flatten(await Promise.all(services.map(async (service) => {
    const usersOfService = await Promise.all(organisations.map(async (organisation) => {
      const usersOfServiceByOrg = await storage.getUsersOfService(organisation.id, service.id);
      return usersOfServiceByOrg.map((user) => {
        return {
          userId: user.id,
          service,
          organisation,
          role: user.role,
        };
      });
    }));
    return flatten(usersOfService);
  })));

  const users = partition(allUserAccess, (item) => {
    return item.userid;
  }).filter((item) => {
    return item.length > 0;
  }).map((item) => {
    return {
      id: item[0].userId,
      access: item,
    };
  });

  res.render('dev/views/userAccessList', {
    users,
  });
};

const listInvitationServices = async (req, res) => {
  const storage = new InvitationsStorage();
  const invitations = await storage.list();

  let groupedInvitations = innerPartition(invitations, (item) => {
    return item.invitationId;
  });
  groupedInvitations = groupedInvitations.filter((item) => {
    return item.length > 0;
  }).map((item) => {
    return {
      id: item[0].invitationId,
      access: item,
    };
  });

  res.render('dev/views/invitationsList', {
    invitations: groupedInvitations,
  });
};
const getLinkInvitation = async (req, res) => {
  const storage = new ServicesStorage();
  const orgStorage = new OrganisationsStorage();
  const services = await storage.list();
  const orgs = await orgStorage.list();

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

  const storage = new InvitationsStorage();
  await storage.upsert({
    invitationId,
    organisationId,
    serviceId,
    roleId,
  });

  res.redirect('/manage');
};

const routes = () => {
  router.get('/', (req, res) => {
    res.render('dev/views/launch');
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
