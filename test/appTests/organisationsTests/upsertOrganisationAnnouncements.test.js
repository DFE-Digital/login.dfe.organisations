jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => ({
  upsertAnnouncement: jest.fn(),
}));

const { upsertAnnouncement } = require('./../../../src/app/organisations/data/organisationsStorage');
const upsertOrganisationAnnouncement = require('./../../../src/app/organisations/upsertOrganisationAnnouncement');

const res = {
  json: jest.fn(),
  status: jest.fn(),
  send: jest.fn(),
  mockResetAll: function () {
    this.json.mockReset().mockReturnValue(this);
    this.status.mockReset().mockReturnValue(this);
    this.send.mockReset().mockReturnValue(this);
  },
};


describe('when listing announcements for organisation', () => {
  let req;
  let announcement;

  beforeEach(() => {
    req = {
      params: {
        id: 'org-1',
      },
      body: {
        originId: 'message-a',
        type: 1,
        title: 'Test Two',
        summary: 'Second test',
        body: 'Second test of announcements',
        publishedAt: '2019-01-30T14:35:45Z',
        expiresAt: '2020-01-30T14:35:45Z',
        published: true,
      },
    };

    res.mockResetAll();

    announcement = {
      id: 'announcement-1',
      originId: 'message-a',
      organisationId: 'org-1',
      type: 1,
      title: 'Test Two',
      summary: 'Second test',
      body: 'Second test of announcements',
      publishedAt: '2019-01-30T14:35:45Z',
      expiresAt: '2020-01-30T14:35:45Z',
      published: true,
    };
    upsertAnnouncement.mockReset().mockReturnValue(announcement);
  });

  it('then it should return announcement as json with accepted status', async () => {
    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(announcement);
  });

  it('then it should upsert announcement in repository', async () => {
    await upsertOrganisationAnnouncement(req, res);

    expect(upsertAnnouncement).toHaveBeenCalledTimes(1);
    expect(upsertAnnouncement).toHaveBeenCalledWith(
      'message-a',
      'org-1',
      1,
      'Test Two',
      'Second test',
      'Second test of announcements',
      '2019-01-30T14:35:45Z',
      '2020-01-30T14:35:45Z',
      true,
    );
  });

  it('then it should return bad request response if originId missing', async () => {
    req.body.originId = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'originId must be specified',
      ],
    });
  });

  it('then it should return bad request response if type missing', async () => {
    req.body.type = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'type must be specified',
      ],
    });
  });

  it('then it should return bad request response if type is invalid', async () => {
    req.body.type = 3;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'type must be one of 1, 2, 4, 5. Received 3',
      ],
    });
  });

  it('then it should return bad request response if title missing', async () => {
    req.body.title = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'title must be specified',
      ],
    });
  });

  it('then it should return bad request response if summary missing', async () => {
    req.body.summary = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'summary must be specified',
      ],
    });
  });

  it('then it should return bad request response if body missing', async () => {
    req.body.body = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'body must be specified',
      ],
    });
  });

  it('then it should return bad request response if publishedAt missing', async () => {
    req.body.publishedAt = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'publishedAt must be specified',
      ],
    });
  });

  it('then it should return bad request response if published missing', async () => {
    req.body.published = undefined;

    await upsertOrganisationAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      reasons: [
        'published must be specified',
      ],
    });
  });
});
