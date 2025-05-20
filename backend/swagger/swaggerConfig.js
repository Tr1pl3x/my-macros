// swagger/swaggerConfig.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Macros App API',
      version: '1.0.0',
      description: 'API for estimating macros from food images using Claude 3',
      contact: {
        name: 'API Support',
        url: 'https://mymacrosapp.example.com/support',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.mymacrosapp.example.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 400,
            },
            error: {
              type: 'string',
              example: 'Invalid input',
            },
          },
        },
        VerifyRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              example: '2911',
            },
          },
        },
        VerifyResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Authentication successful',
            },
          },
        },
        EstimateRequest: {
          type: 'object',
          required: ['image'],
          properties: {
            image: {
              type: 'string',
              format: 'binary',
              description: 'Food image to analyze',
            },
            mode: {
              type: 'string',
              enum: ['basic', 'detailed'],
              default: 'basic',
              description: 'Analysis mode',
            },
          },
        },
        EstimateResponse: {
          type: 'object',
          properties: {
            calories: {
              type: 'string',
              example: '540',
            },
            protein: {
              type: 'string',
              example: '30g',
            },
            carbs: {
              type: 'string',
              example: '45g',
            },
            fat: {
              type: 'string',
              example: '22g',
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['grilled chicken', 'rice', 'broccoli'],
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;