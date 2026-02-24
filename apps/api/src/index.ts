import express from 'express';
import { apiReference } from '@scalar/express-api-reference';
import type { ApiResponse, HealthResponse } from '@repo/shared';

const app = express();
const PORT = 3001;

app.use(express.json());

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Repo API',
    version: '1.0.0',
    description: 'Express.js backend for the monorepo',
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Returns the current server status and timestamp.',
        operationId: 'getHealth',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

app.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.use(
  '/docs',
  apiReference({
    url: '/openapi.json',
    theme: 'default',
  })
);

app.get('/api/health', (_req, res) => {
  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/docs`);
});
