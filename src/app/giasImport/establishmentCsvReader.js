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
const mapRow = (row) => {
  let closedOn = null;
  if (row[9]) {
    closedOn = moment.utc(row[9], 'DD-MM-YYYY').toDate();
  }

  let status = null;
  if (row[7]) {
    status = parseInt(row[7]);
  }

  return {
    urn: row[0] || null,
    laCode: row[1] || null,
    establishmentNumber: row[3] || null,
    name: row[4] || null,
    type: row[5] || null,
    status,
    closedOn,
    ukprn: row[14] || null,
    address1: row[15] || null,
    address2: row[16] || null,
    address3: row[17] || null,
    town: row[18] || null,
    county: row[20] || null,
    postcode: row[21] || null,
  };
};

const parse = async (data) => {
  const rows = await parseCsv(data);
  if (!rows || rows.length < 2) {
    return [];
  }

  return rows.slice(1).map(mapRow);
};

module.exports = {
  parse,
};
