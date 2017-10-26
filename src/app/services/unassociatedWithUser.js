const action = (req, res) => {
  const availableServices = [
    { id: '1', title: 'Service 1', description: 'abc' },
  ];

  res.contentType('json').send(JSON.stringify(availableServices));
};

module.exports = action;