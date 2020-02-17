'use strict';

const config = require('./../config')();

const { makeConnection } = require('./connection');
const externalIdentifiersModel = require('./externalIdentifiers');
const invitationExternalIdentifiersModel = require('./invitationExternalIdentifiers');
const invitationOrganisationsModel = require('./invitationOrganisations');
const invitationsModel = require('./invitations');
const organisationAnnoucementsModel = require('./organisationAnnoucements');
const organisationAssociationsModel = require('./organisationAssociations');
const organisationsModel = require('./organisations');
const servicesModel = require('./services');
const usersModel = require('./users');
const userOrganisationsModel = require('./userOrganisations');
const countersModel = require('./counters');
const userOrganisationRequestsModel = require('./userOrganisationRequests');

const db = makeConnection();

const defineStatic = model => {
  model.roles = [
    { id: 0, name: 'End user' },
    { id: 10000, name: 'Approver' }
  ];

  model.organisationUserStatus = [
    { id: -1, name: 'Rejected' },
    { id: 0, name: 'Pending' },
    { id: 1, name: 'Approved' }
  ];

  model.organisationRequestStatus = [
    { id: -1, name: 'Rejected' },
    { id: 0, name: 'Pending' },
    { id: 1, name: 'Approved' },
    { id: 2, name: 'Overdue' },
    { id: 3, name: 'No Approvers' }
  ];

  model.organisationStatus = [
    { id: 1, name: 'Open' },
    { id: 2, name: 'Closed' },
    { id: 3, name: 'Proposed to close' },
    { id: 4, name: 'Proposed to open' }
  ];

  model.organisationCategory = [
    { id: '001', name: 'Establishment' },
    { id: '002', name: 'Local Authority' },
    { id: '003', name: 'Other Legacy Organisations' },
    { id: '004', name: 'Early Year Setting' },
    { id: '008', name: 'Other Stakeholders' },
    { id: '009', name: 'Training Providers' },
    { id: '010', name: 'Multi-Academy Trust' },
    { id: '011', name: 'Government' },
    { id: '012', name: 'Other GIAS Stakeholder' },
    { id: '013', name: 'Single-Academy Trust' },
    { id: '050', name: 'Software Suppliers' },
    { id: '051', name: 'Further Education' }
  ];

  model.establishmentTypes = [
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
    { id: '29', name: 'Higher education institution' },
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
    { id: '46', name: 'Academy 16-19 Sponsor Led' }
  ];

  model.phasesOfEducation = [
    { id: 0, name: 'Not applicable' },
    { id: 1, name: 'Nursery' },
    { id: 2, name: 'Primary' },
    { id: 3, name: 'Middle deemed primary' },
    { id: 4, name: 'Secondary' },
    { id: 5, name: 'Middle deemed secondary' },
    { id: 6, name: '16 plus' },
    { id: 7, name: 'All through' }
  ];

  model.regionCodes = [
    { id: 'A', name: 'North East' },
    { id: 'B', name: 'North West' },
    { id: 'D', name: 'Yorkshire and the Humber' },
    { id: 'E', name: 'East Midlands' },
    { id: 'F', name: 'West Midlands' },
    { id: 'G', name: 'East of England' },
    { id: 'H', name: 'London' },
    { id: 'J', name: 'South East' },
    { id: 'K', name: 'South West' },
    { id: 'W', name: 'Wales (pseudo)' },
    { id: 'Z', name: 'Not Applicable' }
  ];
};
const buildDataModel = (model, connection, entityModels) => {
  const dbSchema = config.database.schema || 'services';

  // Define
  entityModels.forEach(entityModel => {
    model[entityModel.name] = entityModel.define(db, dbSchema);
  });
  defineStatic(model);

  // Extend
  entityModels
    .filter(m => m.extend !== undefined)
    .forEach(entityModel => {
      entityModel.extend(model);
    });
};
const dataModel = {
  getNextNumericId: async () => {
    let result = await db.query(
      'SELECT NEXT VALUE FOR numeric_id_sequence AS numId;',
      {
        type: 'SELECT'
      }
    );

    return result[0].numId;
  }
};
buildDataModel(dataModel, db, [
  externalIdentifiersModel,
  invitationExternalIdentifiersModel,
  invitationOrganisationsModel,
  invitationsModel,
  organisationAnnoucementsModel,
  organisationAssociationsModel,
  organisationsModel,
  servicesModel,
  usersModel,
  userOrganisationsModel,
  countersModel,
  userOrganisationRequestsModel
]);

module.exports = dataModel;
