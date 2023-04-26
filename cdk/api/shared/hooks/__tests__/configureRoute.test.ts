import { RouteOptions, FastifySchema } from 'fastify';

import configureRoute, { configuredRoutes } from '../configureRoute';

describe('configureRoute', () => {
  beforeEach(() => {
    // Initialize the set before each test
    configuredRoutes.clear();
  });

  it('should configure a route and add it to the configuredRoutes set', () => {
    const route: RouteOptions = {
      url: '/test',
      method: 'GET',
      handler: () => {}
    };

    configureRoute(route);

    expect(configuredRoutes.has('/test')).toBe(true);
  });

  it('should not configure a route that has already been configured inside of the configuredRoutes set', () => {
    const route: RouteOptions = {
      url: '/test',
      method: 'GET',
      handler: () => {}
    };

    configureRoute(route);
    configureRoute(route);

    expect(configuredRoutes.size).toBe(1);
  });

  it('should not modify the schema if one is already provided', () => {
    const route: RouteOptions = {
      method: 'GET',
      handler: () => {},
      url: '/metrics/:channelResourceId/streamSessions',
      schema: {
        params: {
          properties: {
            channelResourceId: {
              type: 'string',
              maxLength: 20
            }
          }
        }
      }
    };
    const originalSchema = route.schema;
    configureRoute(route);
    expect(route.schema).toEqual(originalSchema);
  });

  it('should create a default schema for the route if one is not provided', () => {
    let route: RouteOptions = {
      url: '/channels/:channelOwnerUsername',
      method: 'GET',
      handler: () => {}
    };
    configureRoute(route);

    const expectedSchema: FastifySchema = {
      params: {
        type: 'object',
        properties: {
          channelOwnerUsername: {
            type: 'string',
            maxLength: 100,
            minLength: 1
          }
        }
      }
    };

    expect(route.schema).toBeDefined();
    expect(route.schema?.params).toEqual(expectedSchema.params);
  });

  it('should not create a default schema for excluded routes', () => {
    const route: RouteOptions = {
      url: '/products/:keywords',
      method: 'GET',
      handler: () => {}
    };
    configureRoute(route);
    expect(route.schema).toBeUndefined();
  });

  it('should not create a default schema for routes without path parameters', () => {
    const route: RouteOptions = {
      url: '/products',
      method: 'GET',
      handler: () => {}
    };
    configureRoute(route);
    expect(route.schema).toBeUndefined();
  });
});
