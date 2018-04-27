'use strict';

const config = require('./../config')();

const { makeConnection } = require('./connection');
const { define: defineExternalIdentifiers, extend: extendExternalIdentifiers } = require('./externalIdentifiers');
const { define: defineInvitationExternalIdentifiers, extend: extendInvitationExternalIdentifiers } = require('./invitationExternalIdentifiers');
const { define: defineInvitations, extend: extendInvitations } = require('./invitations');
const { define: defineOrganisationAssociations, extend: extendOrganisationAssociations } = require('./organisationAssociations');
const { define: defineOrganisations, extend: extendOrganisations } = require('./organisations');
const { define: defineServices, extend: extendServices } = require('./services');
const { define: defineUsers, extend: extendUsers } = require('./users');

const db = makeConnection();
const dbSchema = config.database.schema || 'services';

const dataModel = {
  externalIdentifiers: defineExternalIdentifiers(db, dbSchema),
  invitationExternalIdentifiers: defineInvitationExternalIdentifiers(db, dbSchema),
  invitations: defineInvitations(db, dbSchema),
  organisationAssociations: defineOrganisationAssociations(db, dbSchema),
  organisations: defineOrganisations(db, dbSchema),
  services: defineServices(db, dbSchema),
  users: defineUsers(db, dbSchema),
};

extendExternalIdentifiers(dataModel);
extendInvitationExternalIdentifiers(dataModel);
extendInvitations(dataModel);
extendOrganisationAssociations(dataModel);
extendOrganisations(dataModel);
extendServices(dataModel);
extendUsers(dataModel);

dataModel.roles = [
  { id: 0, name: 'End user' },
  { id: 10000, name: 'Approver' },
];

dataModel.organisationStatus = [
  { id: 1, name: 'Open' },
  { id: 2, name: 'Closed' },
  { id: 3, name: 'Proposed to close' },
  { id: 4, name: 'Proposed to open' },
];

dataModel.organisationCategory = [
  { id: '001', name: 'Establishment' },
  { id: '002', name: 'Local Authority' },
  { id: '010', name: 'Multi-Academy Trust' },
  { id: '013', name: 'Single-Academy Trust' },
];

dataModel.establishmentTypes = [
  { id: '01', name: 'Community School' },
  { id: '02', name: 'Voluntary Aided School' },
  { id: '03', name: 'Voluntary Controlled School' },
  { id: '05', name: 'Foundation School' },
  { id: '06', name: 'City Technology College' },
  { id: '07', name: 'Community Special School' },
  { id: '08', name: 'Non-Maintained Special School' },
  { id: '10', name: 'Other Independent Special School' },
  { id: '11', name: 'Other Independent School' },
  { id: '12', name: 'Foundation Special School' },
  { id: '14', name: 'Pupil Referral Unit' },
  { id: '15', name: 'LA Nursery School' },
  { id: '18', name: 'Further Education' },
  { id: '24', name: 'Secure Units' },
  { id: '25', name: 'Offshore Schools' },
  { id: '26', name: 'Service Childrens Education' },
  { id: '28', name: 'Academy Sponsor Led' },
  { id: '30', name: 'Welsh Establishment' },
  { id: '32', name: 'Special Post 16 Institution' },
  { id: '33', name: 'Academy Special Sponsor Led' },
  { id: '34', name: 'Academy Converter' },
  { id: '35', name: 'Free Schools' },
  { id: '36', name: 'Free Schools Special' },
  { id: '38', name: 'Free Schools - Alternative Provision' },
  { id: '39', name: 'Free Schools - 16-19' },
  { id: '40', name: 'University Technical College' },
  { id: '41', name: 'Studio Schools' },
  { id: '42', name: 'Academy Alternative Provision Converter' },
  { id: '43', name: 'Academy Alternative Provision Sponsor Led' },
  { id: '44', name: 'Academy Special Converter' },
  { id: '45', name: 'Academy 16-19 Converter' },
  { id: '46', name: 'Academy 16-19 Sponsor Led' },
];

module.exports = dataModel;
