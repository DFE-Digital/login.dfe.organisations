const csv = require('csv');

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
  return {
    uid: row[1] || null,
    urn: row[0] || null,
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
