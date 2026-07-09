import swaggerJSDoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json (fallback to 1.0.0)
let version = '1.0.0';
try {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
  );
  version = pkg.version || version;
} catch {
  // keep default version
}

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Daily Update API',
      version,
      description:
        'REST API for the Daily Update application. Generate, format, and manage daily and weekly progress updates, companies, tags, templates, and more.',
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT bearer token obtained from /auth/login or /auth/register',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and account management' },
      { name: 'Daily Updates', description: 'Create and manage daily updates' },
      { name: 'Weekly Updates', description: 'Generate and manage weekly updates' },
      { name: 'Companies', description: 'Manage companies' },
      { name: 'Tags', description: 'Manage tags' },
      { name: 'Templates', description: 'Manage update templates' },
      { name: 'Analytics', description: 'Usage analytics and statistics' },
      { name: 'Export', description: 'Export updates to various formats' },
      { name: 'Schedules', description: 'Scheduled updates' },
      { name: 'Notifications', description: 'Notifications and preferences' },
      { name: 'Teams', description: 'Team collaboration' },
      { name: 'Integrations', description: 'Third-party integrations' },
    ],
  },
  // Glob the route and controller files so @openapi JSDoc annotations are picked up.
  apis: [
    join(__dirname, '..', 'routes', '*.js'),
    join(__dirname, '..', 'controllers', '*.js'),
  ],
};

// Build the OpenAPI spec
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
