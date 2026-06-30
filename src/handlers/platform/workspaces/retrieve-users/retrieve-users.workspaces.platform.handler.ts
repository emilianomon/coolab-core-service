import { app } from '@self/app';
import { retrieveUsersWorkspacesApplication } from '@self/application';
import { PlatformContext } from '@self/contexts';
import { RoutingUtil } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(RoutingUtil.route({
  description: 'Retrieves users in the current workspace.',
  method: 'get',
  middleware: PlatformContext.middleware(),
  path: RoutingUtil.path('/platform/v1/workspaces/{id}/users'),
  request: {
    params: validation().object({
      id: validation().literal('current'),
    }),
    query: validation().object({
      pageNumber: validation().pageNumber(),
      pageSize: validation().pageSize(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: validation().tables().workspaceUsers().selectable().extend({
            user: validation().tables().users().selectable().pick({
              createdAt: true,
              email: true,
              id: true,
              name: true,
              picture: true,
              updatedAt: true,
            }),
          }).array(),
        },
      },
      description: 'The users in the current workspace.',
    },
    401: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The request is not authenticated.',
    },
    403: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The request is not authorized for a workspace.',
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
  const workspace = PlatformContext.getWorkspace();
  const query = c.req.valid('query');

  const result = await retrieveUsersWorkspacesApplication({
    pagination: {
      limit: query.pageSize,
      page: query.pageNumber,
    },
    workspaceId: workspace.id,
  });

  const response = c.json(result, 200);
  return response;
});

export { handler as retrieveUsersWorkspacesPlatformHandler };
