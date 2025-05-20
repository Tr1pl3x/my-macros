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
              type: ['string', 'null'],
              example: '540',
              description: 'Estimated calories or null if no food detected',
            },
            protein: {
              type: ['string', 'null'],
              example: '30g',
              description: 'Estimated protein content or null if no food detected',
            },
            carbs: {
              type: ['string', 'null'],
              example: '45g',
              description: 'Estimated carbohydrate content or null if no food detected',
            },
            fat: {
              type: ['string', 'null'],
              example: '22g',
              description: 'Estimated fat content or null if no food detected',
            },
            ingredients: {
              type: ['array', 'null'],
              items: {
                type: 'string',
              },
              example: ['grilled chicken', 'rice', 'broccoli'],
              description: 'Identified ingredients or null if no food detected',
            },
            message: {
              type: ['string', 'null'],
              example: 'No edible food detected in the image',
              description: 'Optional message explaining why values are null, if applicable',
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