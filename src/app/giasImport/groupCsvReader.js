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
  if (row[6]) {
    closedOn = moment.utc(row[6], 'DD-MM-YYYY').toDate();
  }

  return {
    uid: row[0] || null,
    name: row[2] || null,
    type: row[4] || null,
    status: row[7] || null,
    closedOn,
    address: [
      row[9] || null,
      row[10] || null,
      row[11] || null,
      row[12] || null,
      row[13] || null,
      row[14] || null,
    ]
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
