import { createRoute } from '@hono/zod-openapi';

type Version = 'v1';
type Client = 'platform';
type Resource = 'auth' | 'users';
type Param = `{${string}}`;
type Action = string;

type Path =
  | `/${Client}/${Version}/${Resource}`
  | `/${Client}/${Version}/${Resource}/${Param}`
  | `/${Client}/${Version}/${Resource}/${Param}/${Action}`
  | `/${Client}/${Version}/${Resource}/${Action}`;

class RoutingUtil {
  public static path<T extends Path>(value: T): T {
    return value;
  }

  public static route: typeof createRoute = config => {
    if(config.request?.body) {
      config.request.body.required = true;
    }

    return createRoute(config);
  };
}

export { RoutingUtil };
