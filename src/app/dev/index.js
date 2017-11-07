'use strict';

const express = require('express');

const router = express.Router({ mergeParams: true });
const uuid = require('uuid/v4');
const _ = require('lodash');

const ServicesStorage = require('./../services/data/servicesStorage');
const OrganisationsStorage = require('./../services/data/organisationsStorage');

const compareNameAttr = (x, y) => {
  if (x.name.toUpperCase() < y.name.toUpperCase()) {
    return -1;
  }
  if (x.name.toUpperCase() > y.name.toUpperCase()) {
    return 1;
  }
  return 0;
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


const routes = () => {
  router.get('/', (req, res) => {
    res.render('dev/views/launch');
  });

  router.get('/services', async (req, res) => {
    const storage = new ServicesStorage();
    const services = await storage.list();
    res.render('dev/views/servicesList', {
      services: services.sort(compareNameAttr),
    });
  });

  router.get('/services/new', (req, res) => {
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
  });
  router.post('/services/new', async (req, res) => {
    const id = uuid();
    const name = req.body.name;
    const description = req.body.description || '';

    const storage = new ServicesStorage();
    await storage.create(id, name, description);

    res.redirect('/manage/services');
  });
  router.get('/services/:id', async (req, res) => {
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
  });
  router.post('/services/:id', async (req, res) => {
    const id = req.params.id;
    const name = req.body.name;
    const description = req.body.description || '';

    const storage = new ServicesStorage();
    await storage.update(id, name, description);

    res.redirect('/manage/services');
  });

  router.get('/organisations', async (req, res) => {
    const storage = new OrganisationsStorage();
    const organisations = await storage.list();
    res.render('dev/views/organisationsList', {
      organisations: organisations.sort(compareNameAttr),
    });
  });

  router.get('/organisations/new', (req, res) => {
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
  });

  router.post('/organisations/new', async (req, res) => {
    const id = uuid();
    const name = req.body.name;

    const storage = new OrganisationsStorage();
    await storage.createOrg(id, name);

    res.redirect('/manage/organisations');
  });
  router.get('/organisations/:id', async (req, res) => {
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
  });
  router.post('/organisations/:id', async (req, res) => {
    const id = req.params.id;
    const name = req.body.name;

    const storage = new OrganisationsStorage();
    await storage.updateOrg(id, name);

    res.redirect('/manage/organisations');
  });

  router.get('/seed-user-services', seedUserServices);
  router.post('/seed-user-services', postSeedUserServices);

  router.get('/user-access', async (req, res) => {
    const storage = new ServicesStorage();
    const services = await storage.list();
    const orgStorage = new OrganisationsStorage();
    const organisations = await orgStorage.list();

    const allUserAccess = _.flatten(await Promise.all(services.map(async (service) => {
      const usersOfService = await Promise.all(organisations.map(async (organisation) => {
        const usersOfServiceByOrg =  await storage.getUsersOfService(organisation.id, service.id);
        return usersOfServiceByOrg.map((user) => {
          return {
            userId: user.id,
            service,
            organisation,
            role: user.role,
          };
        });
      }));
      return _.flatten(usersOfService);
    })));

    const users = _.partition(allUserAccess, (item) => {
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
  });

  return router;
};

module.exports = routes;
