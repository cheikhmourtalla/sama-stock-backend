import swaggerJSDoc, { OAS3Options } from "swagger-jsdoc";

const options: OAS3Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "Sama Stock Api",
      version: "1.0.0",
      description: "Description",
    },
     components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  // On pointe vers les fichiers .ts en dev, et .js en prod
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"], 
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
