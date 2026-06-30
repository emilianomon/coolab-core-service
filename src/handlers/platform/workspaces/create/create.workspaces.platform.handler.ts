import { app } from '@self/app';
import { createWorkspacesApplication } from '@self/application';
import { PlatformContext } from '@self/contexts';
import { RoutingUtil } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(RoutingUtil.route({
  description: 'Creates a workspace for the authenticated platform user.',
  method: 'post',
  middleware: PlatformContext.middleware(),
  path: RoutingUtil.path('/platform/v1/workspaces'),
  request: {
    body: {
      content: {
        'application/json': {
          schema: validation().tables().workspaces().insertable().omit({
            picture: true,
          }).extend({
            picture: validation().picture().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: validation().tables().workspaces().selectable(),
        },
      },
      description: 'The workspace was created.',
    },
    400: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The request is invalid.',
    },
    401: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The request is not authenticated.',
    },
    500: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'An unexpected error occurred.',
    },
  },
  tags: ['Workspaces'],
}), async c => {
  const user = PlatformContext.getUser();
  const body = c.req.valid('json');

  const result = await createWorkspacesApplication({
    name: body.name,
    picture: body.picture,
    userId: user.id,
  });

  return c.json(result, 201);
});

export { handler as createWorkspacesPlatformHandler };
