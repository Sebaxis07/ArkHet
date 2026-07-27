import type { Project, Endpoint } from '../types/architecture';

export interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  item: Array<{
    name: string;
    request: {
      method: string;
      header: Array<{ key: string; value: string }>;
      url: {
        raw: string;
        host: string[];
        path: string[];
      };
    };
  }>;
}

export function generatePostmanCollection(project: Project): PostmanCollection {
  const nodes = project.nodes || [];
  const endpoints = nodes.flatMap(n => n.endpoints || []);

  const items = endpoints.map((ep) => {
    const rawUrl = `http://localhost:5000${ep.path}`;
    const urlParts = ep.path.split('/').filter(Boolean);

    return {
      name: `${ep.method} ${ep.path} - ${ep.description || 'Endpoint REST'}`,
      request: {
        method: ep.method,
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{JWT_TOKEN}}' }
        ],
        url: {
          raw: rawUrl,
          host: ['http:', '', 'localhost:5000'],
          path: urlParts
        }
      }
    };
  });

  return {
    info: {
      name: `Colección API Arkhet - ${project.name}`,
      description: `Colección Postman v2.1 autogenerada para los endpoints del proyecto ${project.name}`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: items.length > 0 ? items : [
      {
        name: 'GET /api/v1/health Probe',
        request: {
          method: 'GET',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          url: {
            raw: 'http://localhost:5000/api/v1/health',
            host: ['http:', '', 'localhost:5000'],
            path: ['api', 'v1', 'health']
          }
        }
      }
    ]
  };
}

export function generateMockJsonResponse(endpoint: Endpoint): any {
  const path = endpoint.path.toLowerCase();

  if (path.includes('health') || path.includes('status')) {
    return { status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0', uptime: 99.98 };
  }
  if (path.includes('auth') || path.includes('login')) {
    return { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: { id: 'usr-1', username: 'Sebaxis07' } };
  }
  if (path.includes('user')) {
    return [
      { id: 'usr-1', username: 'Sebaxis07', role: 'admin', email: 'sebaxis@gmail.com' }
    ];
  }
  return { success: true, message: `Mock response for ${endpoint.method} ${endpoint.path}`, data: [] };
}

export function generateJestTestSuite(project: Project): string {
  const endpoints = (project.nodes || []).flatMap(n => n.endpoints || []);

  return `const request = require('supertest');
const app = require('../server');

describe('Suite de Pruebas API Autogenerada - ${project.name}', () => {
  ${endpoints.map(ep => `
  it('Debe responder 200 OK en ${ep.method} ${ep.path}', async () => {
    const res = await request(app)
      .${ep.method.toLowerCase()}('${ep.path}')
      .set('Authorization', 'Bearer test_token');
    expect(res.statusCode).toBe(200);
  });`).join('\n')}
});
`;
}
