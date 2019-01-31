jest.mock('./../../../src/app/organisations/data/organisationsStorage', () => ({
  listAnnouncements: jest.fn(),
}));

const { listAnnouncements } = require('./../../../src/app/organisations/data/organisationsStorage');
const listOrganisationAnnouncements = require('./../../../src/app/organisations/listOrganisationAnnouncements');

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
  let pageOfAnnouncements;

  beforeEach(() => {
    req = {
      params: {
        id: 'org-1',
      },
    };

    res.mockResetAll();

    pageOfAnnouncements = {
      announcements: [{
        id: 'announcement-1',
        originId: 'message-a',
        organisationId: 'org-1',
        type: 1,
        title: 'test one',
        summary: 'first test',
        body: 'first announcement for test',
        publishedAt: new Date(2019, 1, 30, 11, 30, 29),
        expiresAt: new Date(2020, 2, 1, 23, 59, 45),
        published: true,
      }],
      page: 1,
      numberOfPages: 2,
      totalNumberOfRecords: 20,
    };
    listAnnouncements.mockReset().mockReturnValue(pageOfAnnouncements);
  });

  it('then it should return page of announcements as json', async () => {
    await listOrganisationAnnouncements(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(pageOfAnnouncements);
  });

  it('then it should get page of announcements from repository using defaults if no options provided', async () => {
    await listOrganisationAnnouncements(req, res);

    expect(listAnnouncements).toHaveBeenCalledTimes(1);
    expect(listAnnouncements).toHaveBeenCalledWith('org-1', undefined, true, 1, 25);
  });

  it('then it should get page of announcements from repository using provided options', async () => {
    req.query = {
      page: 2,
      pagesize: 10,
      onlypublished: 'no',
    };

    await listOrganisationAnnouncements(req, res);

    expect(listAnnouncements).toHaveBeenCalledTimes(1);
    expect(listAnnouncements).toHaveBeenCalledWith('org-1', undefined, false, 2, 10);
  });

  it('then it should return bad request if onlyPublished specified but invalid', async () => {
    req.query = {
      onlypublished: 'nope',
    };

    await listOrganisationAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      reason: 'query param onlypublished must be binary (true/yes/1/false/no/0) but received nope',
    });
  });

  it('then it should return bad request if page specified but not a number', async () => {
    req.query = {
      page: 'one',
    };

    await listOrganisationAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      reason: 'query param page must be a number but received one',
    });
  });

  it('then it should return bad request if pageSize specified but not a number', async () => {
    req.query = {
      pagesize: 'ten',
    };

    await listOrganisationAnnouncements(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      reason: 'query param pageSize must be a number but received ten',
    });
  });
});
