const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.1.0', // YOU NEED THIS
  info: {
    title: 'Dfe Signin organisation Api',
    version: '1.0.0',
    description: 'Dfe Signin organisation-Api',
  },
  basePath: '/',
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{
    bearerAuth: [],
  }],
};

// options for the swagger docs
const options = {
  // import swaggerDefinitions
  swaggerDefinition,
  // path to the API docs
  apis: ['./*/routes.js', './*/index.js', './*/*/*/index.js', './*/*/*/routes.js'],
};

// initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, options };
