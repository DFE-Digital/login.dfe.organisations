jest.mock('./../../../../src/infrastructure/repository', () => {
  const { createJestMockForSequelizeEntity } = require('./../../../utils/mocks');
  const invitation = createJestMockForSequelizeEntity({
    invitation_id: 'inv1',
    role_id: '0',
  });
  invitation.Service = createJestMockForSequelizeEntity({
    id: 'svc1',
    name: 'Service one',
  });
  invitation.Organisation = createJestMockForSequelizeEntity({
    id: 'org1',
    name: 'Organisation one',
  });
  invitation.destroy = jest.fn();

  return {
    invitations: {
      findOne: jest.fn().mockReturnValue(invitation),
      create: jest.fn(),
    },
  };
});
jest.mock('./../../../../src/infrastructure/logger', () => {
  return {
    error: jest.fn(),
  };
});

const { createJestMockForSequelizeEntity } = require('./../../../utils/mocks');
const db = require('./../../../../src/infrastructure/repository');
const { Op } = require('sequelize');
const InvitationsStorage = require('./../../../../src/app/invitations/data/invitationsStorage');
const storage = new InvitationsStorage();
const details = {
  invitationId: 'inv1',
  organisationId: '',
  serviceId: '',
  roleId: 0,
};

describe('when upserting and invitation mapping', () => {
  beforeEach(() => {
    db.invitations.findOne.mockReset();
    db.invitations.create.mockReset();
  });

  it('then it should check for exiting record by invitation_id, service_id and organisation_id', async () => {
    await storage.upsert(details);

    expect(db.invitations.findOne.mock.calls.length).toBe(1);

    expect(db.invitations.findOne.mock.calls[0][0].where).toMatchObject({
      invitation_id: {
        [Op.eq]: details.invitationId,
      },
      service_id: {
        [Op.eq]: details.serviceId,
      },
      organisation_id: {
        [Op.eq]: details.organisationId,
      },
    });
  });

  it('then it should destory the existing record if found', async () => {
    const invitation = createJestMockForSequelizeEntity({
      invitation_id: 'inv1',
      role_id: '0',
    });
    invitation.destroy = jest.fn();
    db.invitations.findOne.mockReturnValue(invitation);

    await storage.upsert(details);

    expect(invitation.destroy.mock.calls.length).toBe(1);
  });

  it('then it should create new record when existing record found', async () => {
    await storage.upsert(details);

    expect(db.invitations.create.mock.calls.length).toBe(1);
    expect(db.invitations.create.mock.calls[0][0]).toMatchObject({
      invitation_id: details.invitationId,
      organisation_id: details.organisationId,
      service_id: details.serviceId,
      role_id: details.roleId,
    });
  });

  it('then it should create new record when no existing record found', async () => {
    db.invitations.findOne.mockReturnValue(null);

    await storage.upsert(details);

    expect(db.invitations.create.mock.calls.length).toBe(1);
    expect(db.invitations.create.mock.calls[0][0]).toMatchObject({
      invitation_id: details.invitationId,
      organisation_id: details.organisationId,
      service_id: details.serviceId,
      role_id: details.roleId,
    });
  });
});