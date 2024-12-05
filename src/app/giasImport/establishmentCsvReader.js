const csv = require("csv");
const moment = require("moment");

const parseCsv = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      csv.parse(
        data,
        {
          auto_parse: false,
        },
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        },
      );
    } catch (e) {
      reject(e);
    }
  });
};
const getColumnIndices = (headerRow) => {
  const columns = [
    { name: "urn", label: "URN", required: true, index: -1 },
    { name: "laCode", label: "LA (code)", required: true, index: -1 },
    { name: "laName", label: "LA (name)", required: true, index: -1 },
    {
      name: "establishmentNumber",
      label: "EstablishmentNumber",
      required: true,
      index: -1,
    },
    { name: "name", label: "EstablishmentName", required: true, index: -1 },
    {
      name: "type",
      label: "TypeOfEstablishment (code)",
      required: true,
      index: -1,
    },
    {
      name: "status",
      label: "EstablishmentStatus (code)",
      required: true,
      index: -1,
    },
    { name: "closedOn", label: "CloseDate", required: false, index: -1 },
    { name: "ukprn", label: "UKPRN", required: true, index: -1 },
    { name: "address1", label: "Street", required: false, index: -1 },
    { name: "address2", label: "Locality", required: false, index: -1 },
    { name: "address3", label: "Address3", required: false, index: -1 },
    { name: "town", label: "Town", required: false, index: -1 },
    { name: "county", label: "County (name)", required: false, index: -1 },
    { name: "postcode", label: "Postcode", required: false, index: -1 },
    {
      name: "phaseOfEducation",
      label: "PhaseOfEducation (code)",
      required: false,
      index: -1,
    },
    {
      name: "statutoryLowAge",
      label: "StatutoryLowAge",
      required: false,
      index: -1,
    },
    {
      name: "statutoryHighAge",
      label: "StatutoryHighAge",
      required: false,
      index: -1,
    },
    { name: "telephone", label: "TelephoneNum", required: false, index: -1 },
    { name: "regionCode", label: "GOR (code)", required: false, index: -1 },
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
      throw new Error(
        `Column ${column.name} (label: ${column.label}) is required but not found`,
      );
    }
    columnIndices[column.name] = column.index;
  }

  return columnIndices;
};
const mapRow = (row, columnIndices) => {
  let closedOn = null;
  if (columnIndices.closedOn > -1 && row[columnIndices.closedOn]) {
    closedOn = moment.utc(row[columnIndices.closedOn], "DD-MM-YYYY").toDate();
  }

  let status = null;
  if (row[columnIndices.status]) {
    status = parseInt(row[columnIndices.status]);
  }

  let phaseOfEducation = null;
  if (
    columnIndices.phaseOfEducation > -1 &&
    row[columnIndices.phaseOfEducation]
  ) {
    phaseOfEducation = parseInt(row[columnIndices.phaseOfEducation]);
  }

  let statutoryLowAge = null;
  if (
    columnIndices.statutoryLowAge > -1 &&
    row[columnIndices.statutoryLowAge]
  ) {
    statutoryLowAge = parseInt(row[columnIndices.statutoryLowAge]);
  }

  let statutoryHighAge = null;
  if (
    columnIndices.statutoryHighAge > -1 &&
    row[columnIndices.statutoryHighAge]
  ) {
    statutoryHighAge = parseInt(row[columnIndices.statutoryHighAge]);
  }

  return {
    urn: row[columnIndices.urn] || null,
    laCode: row[columnIndices.laCode] || null,
    laName: row[columnIndices.laName] || null,
    establishmentNumber: row[columnIndices.establishmentNumber] || null,
    name: row[columnIndices.name] || null,
    type: row[columnIndices.type] || null,
    status,
    closedOn,
    ukprn: row[columnIndices.ukprn] || null,
    address1:
      columnIndices.address1 > -1 ? row[columnIndices.address1] || null : null,
    address2:
      columnIndices.address2 > -1 ? row[columnIndices.address2] || null : null,
    address3:
      columnIndices.address3 > -1 ? row[columnIndices.address3] || null : null,
    town: columnIndices.town > -1 ? row[columnIndices.town] || null : null,
    county:
      columnIndices.county > -1 ? row[columnIndices.county] || null : null,
    postcode:
      columnIndices.postcode > -1 ? row[columnIndices.postcode] || null : null,
    telephone:
      columnIndices.telephone > -1
        ? row[columnIndices.telephone] || null
        : null,
    regionCode:
      columnIndices.regionCode > -1
        ? row[columnIndices.regionCode] || null
        : null,
    phaseOfEducation,
    statutoryLowAge,
    statutoryHighAge,
  };
};

const parse = async (data) => {
  const rows = await parseCsv(data);
  if (!rows || rows.length < 2) {
    return [];
  }

  const columnIndices = getColumnIndices(rows[0]);

  return rows.slice(1).map((row) => mapRow(row, columnIndices));
};

module.exports = {
  parse,
};
