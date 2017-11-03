const express = require('express');
const router = express.Router({ mergeParams: true });
const uuid = require('uuid/v4');
const ServicesStorage = require('./../services/data/servicesStorage');

const serviceCompare = (x, y) => {
  if (x.name.toUpperCase() < y.name.toUpperCase()) {
    return -1;
  }
  if (x.name.toUpperCase() > y.name.toUpperCase()) {
    return 1;
  }
  return 0;
};

const routes = () => {
  router.get('/', (req, res) => {
    res.render('dev/views/launch');
  });

  router.get('/services', async (req, res) => {
    const storage = new ServicesStorage();
    const services = await storage.list();
    res.render('dev/views/servicesList', {
      services: services.sort(serviceCompare),
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

  return router;
};

module.exports = routes;