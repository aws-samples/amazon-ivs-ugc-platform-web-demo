import { DEFAULT_FASTIFY_MAX_PARAM_LENGTH } from '../constants';
import { RouteOptions } from 'fastify';

interface ParamValidation {
  [key: string]: {
    type: string;
    maxLength: number;
    minLength: number;
  };
}

const _getDefaultParamValidations = (pathParams: string[]) => {
  return {
    params: {
      type: 'object',
      properties: pathParams.reduce(
        (acc: ParamValidation, pathParam: string) => {
          acc[pathParam] = {
            type: 'string',
            maxLength: DEFAULT_FASTIFY_MAX_PARAM_LENGTH,
            minLength: 1
          };
          return acc;
        },
        {}
      )
    }
  };
};

const _getRouteSchema = (route: RouteOptions) => {
  let schema;
  const path = route.url;
  const EXCLUDED_ROUTE = '/products/:keywords';

  const routeHasPathParameters = path.includes(':');
  if (routeHasPathParameters && path !== EXCLUDED_ROUTE) {
    // If a schema was not provided when the route was registered, proceed with schema validations
    if (!route.schema) {
      const pathParams = path
        .match(/:(\w+)/g)
        ?.map((param: any) => param.slice(1));

      if (pathParams?.length) {
        schema = _getDefaultParamValidations(pathParams);
      }
    }
  }

  return schema;
};

export const configuredRoutes = new Set<string>();

// Route options: https://www.fastify.io/docs/latest/Reference/Routes/#routes-options
const configureRoute = (route: RouteOptions) => {
  const path = route.url;

  if (configuredRoutes.has(path)) {
    // This route has already been configured, so skip it
    return;
  }

  let schema = _getRouteSchema(route);

  if (schema) route.schema = schema;

  configuredRoutes.add(path);
};

export default configureRoute;
