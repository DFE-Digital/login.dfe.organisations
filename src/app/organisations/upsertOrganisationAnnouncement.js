const { upsertAnnouncement } = require('./data/organisationsStorage');

const getAndValidateModel = (req) => {
  const model = {
    announcement: {
      originId: req.body.originId,
      organisationId: req.params.id,
      type: req.body.type,
      title: req.body.title,
      summary: req.body.summary,
      body: req.body.body,
      publishedAt: req.body.publishedAt,
      expiresAt: req.body.expiresAt,
      published: req.body.published,
    },
    errors: [],
  };
  if (!model.announcement.originId) {
    model.errors.push('originId must be specified');
  }
  if (!model.announcement.type) {
    model.errors.push('type must be specified');
  }
  if (!model.announcement.title) {
    model.errors.push('title must be specified');
  }
  if (!model.announcement.summary) {
    model.errors.push('summary must be specified');
  }
  if (!model.announcement.body) {
    model.errors.push('body must be specified');
  }
  if (!model.announcement.publishedAt) {
    model.errors.push('publishedAt must be specified');
  }
  if (model.announcement.published === undefined || model.announcement.published === null) {
    model.errors.push('published must be specified');
  }
  return model;
};

const upsertOrganisationAnnouncement = async (req, res) => {
  const model = getAndValidateModel(req);
  if (model.errors.length > 0) {
    return res.status(400).json({
      reasons: model.errors,
    });
  }

  const announcement = await upsertAnnouncement(
    model.announcement.originId,
    model.announcement.organisationId,
    model.announcement.type,
    model.announcement.title,
    model.announcement.summary,
    model.announcement.body,
    model.announcement.publishedAt,
    model.announcement.expiresAt,
    model.announcement.published,
  );
  return res.status(202).json(announcement);
};
module.exports = upsertOrganisationAnnouncement;
