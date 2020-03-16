const csv = require('csv');
const moment = require('moment');

const parseCsv = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      csv.parse(data, {
        auto_parse: false,
      }, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};
const getColumnIndices = (headerRow) => {
  const columns = [
    { name: 'uid', label: 'Group UID', required: true, index: -1 },
    { name: 'name', label: 'Group Name', required: true, index: -1 },
    { name: 'companyRegistrationNumber', label: 'Companies House Number', required: true, index: -1 },
    { name: 'type', label: 'Group Type (code)', required: true, index: -1 },
    { name: 'status', label: 'Group Status (code)', required: true, index: -1 },
    { name: 'closedOn', label: 'Closed Date', required: false, index: -1 },
    { name: 'address1', label: 'Group Contact Street', required: false, index: -1 },
    { name: 'address2', label: 'Group Contact Locality', required: false, index: -1 },
    { name: 'address3', label: 'Group Contact Address 3', required: false, index: -1 },
    { name: 'town', label: 'Group Contact Town', required: false, index: -1 },
    { name: 'county', label: 'Group Contact County', required: false, index: -1 },
    { name: 'postCode', label: 'Group Contact Postcode', required: false, index: -1 },
  ];
  const columnIndices = {};

  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    for (let j = 0; j < headerRow.length && column.index === -1; j++) {
      if (column.label.toLowerCase() === headerRow[j].toLowerCase()) {
        column.index = j;
      }
    }
    if (column.required && column.index === -1) {
      throw new Error(`Column ${column.name} (label: ${column.label}) is required but not found`);
    }
    columnIndices[column.name] = column.index;
  }

  return columnIndices;
};
const mapRow = (row, columnIndices) => {
  let closedOn = null;
  if (row[columnIndices.closedOn]) {
    closedOn = moment.utc(row[columnIndices.closedOn], 'DD-MM-YYYY').toDate();
  }

  return {
    uid: row[columnIndices.uid] || null,
    name: row[columnIndices.name] || null,
    companyRegistrationNumber: row[columnIndices.companyRegistrationNumber] || null,
    type: row[columnIndices.type] || null,
    status: row[columnIndices.status] || null,
    closedOn,
    address: [
      row[columnIndices.address1] || null,
      row[columnIndices.address2] || null,
      row[columnIndices.address3] || null,
      row[columnIndices.town] || null,
      row[columnIndices.county] || null,
      row[columnIndices.postCode] || null,
    ],
  };
};

const parse = async (data) => {
  const rows = await parseCsv(data);
  if (!rows || rows.length < 2) {
    return [];
  }

  const columnIndices = getColumnIndices(rows[0]);

  return rows.slice(1).map(row => mapRow(row, columnIndices));
};

module.exports = {
  parse,
};
