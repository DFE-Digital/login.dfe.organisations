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
    invitationOrganisations: {
      find: jest.fn(),
      create: jest.fn(),
    },
  };
});
jest.mock('./../../../../src/infrastructure/logger', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  };
});

const { createJestMockForSequelizeEntity } = require('./../../../utils/mocks');
const db = require('./../../../../src/infrastructure/repository');
const { Op } = require('sequelize');
const invitationStorage = require('./../../../../src/app/invitations/data/invitationsStorage');

describe('when upserting and invitation mapping', () => {
  let details;

  beforeEach(() => {
    details = {
      invitationId: 'inv1',
      organisationId: 'org1',
      serviceId: 'svc1',
      roleId: 0,
    };

    db.invitations.findOne.mockReset();
    db.invitations.create.mockReset();

    db.invitationOrganisations.find.mockReset();
    db.invitationOrganisations.create.mockReset();
  });

  it('then it should check for exiting record by invitation_id, service_id and organisation_id', async () => {
    await invitationStorage.upsert(details);

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

  it('then it should destroy the existing record if found', async () => {
    const invitation = createJestMockForSequelizeEntity({
      invitation_id: 'inv1',
      role_id: '0',
    });
    invitation.destroy = jest.fn();
    db.invitations.findOne.mockReturnValue(invitation);

    await invitationStorage.upsert(details);

    expect(invitation.destroy.mock.calls.length).toBe(1);
  });

  it('then it should create new record when existing record found', async () => {
    await invitationStorage.upsert(details);

    expect(db.invitations.create.mock.calls.length).toBe(1);
    expect(db.invitations.create.mock.calls[0][0]).toMatchObject({
      invitation_id: details.invitationId,
      organisation_id: details.organisationId,
      service_id: details.serviceId,
    });
  });

  it('then it should create new record when no existing record found', async () => {
    db.invitations.findOne.mockReturnValue(null);

    await invitationStorage.upsert(details);

    expect(db.invitations.create.mock.calls.length).toBe(1);
    expect(db.invitations.create.mock.calls[0][0]).toMatchObject({
      invitation_id: details.invitationId,
      organisation_id: details.organisationId,
      service_id: details.serviceId,
    });
  });

  it('then it should destroy the existing organisation record if existing record found and role has changed', async () => {
    const invitationOrganisation = createJestMockForSequelizeEntity({
      invitation_id: 'inv1',
      organisation_id: '',
      role_id: 10000,
    });
    invitationOrganisation.destroy = jest.fn();
    db.invitationOrganisations.find.mockReturnValue(invitationOrganisation);

    await invitationStorage.upsert(details);

    expect(invitationOrganisation.destroy.mock.calls.length).toBe(1);
  });

  it('then it should create new organisation record if existing record found and role has changed', async () => {
    const invitationOrganisation = createJestMockForSequelizeEntity({
      invitation_id: 'inv1',
      organisation_id: 'org1',
      role_id: 10000,
    });
    invitationOrganisation.destroy = jest.fn();
    db.invitationOrganisations.find.mockReturnValue(invitationOrganisation);

    await invitationStorage.upsert(details);

    expect(db.invitationOrganisations.create.mock.calls.length).toBe(1);
    expect(db.invitationOrganisations.create.mock.calls[0][0]).toEqual({
      invitation_id: 'inv1',
      organisation_id: 'org1',
      role_id: 0,
    });
  });

  it('then it should create new organisation record if existing record not found', async () => {
    await invitationStorage.upsert(details);

    expect(db.invitationOrganisations.create.mock.calls.length).toBe(1);
    expect(db.invitationOrganisations.create.mock.calls[0][0]).toEqual({
      invitation_id: 'inv1',
      organisation_id: 'org1',
      role_id: 0,
    });
  });

  it('then it should not modify organisations if existing record found but has not changed', async () => {
    const invitationOrganisation = createJestMockForSequelizeEntity({
      invitation_id: 'inv1',
      organisation_id: 'org1',
      role_id: 0,
    });
    invitationOrganisation.destroy = jest.fn();
    db.invitationOrganisations.find.mockReturnValue(invitationOrganisation);

    await invitationStorage.upsert(details);

    expect(invitationOrganisation.destroy.mock.calls.length).toBe(0);
    expect(db.invitationOrganisations.create.mock.calls.length).toBe(0);
  });

  it('then it should not modify service invitation if service id not in details', async () => {
    const invitation = createJestMockForSequelizeEntity({
      invitation_id: 'inv1',
      role_id: '0',
    });
    invitation.destroy = jest.fn();
    db.invitations.findOne.mockReturnValue(invitation);

    details.serviceId = undefined;
    await invitationStorage.upsert(details);

    expect(invitation.destroy.mock.calls.length).toBe(0);
    expect(db.invitations.create.mock.calls.length).toBe(0);
  });
});