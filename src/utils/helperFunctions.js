const mapArrayToProperty = (array, property) => array.map((e) => e[property]);

const arrayToMapById = (array) => {
  const map = new Map();
  array.forEach((item) => map.set(item.id, item));
  return map;
};

const mapAndFilterArray = (array, map) =>
  array.map((id) => map.get(id)).filter(Boolean);

module.exports = {
  mapArrayToProperty,
  arrayToMapById,
  mapAndFilterArray,
};
