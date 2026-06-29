import { app } from '@self/app';
import { removePictureUsersApplication } from '@self/application';
import { PlatformContext } from '@self/contexts';
import { RoutingUtil } from '@self/utils';
import { validation } from '@self/validation';

const userResponse = validation().tables().users().selectable().pick({
  createdAt: true,
  email: true,
  emailStatus: true,
  id: true,
  lastAuthenticationAt: true,
  name: true,
  picture: true,
  updatedAt: true,
});

const handler = app.openapi(RoutingUtil.route({
  description: 'Removes the authenticated platform user picture.',
  method: 'delete',
  middleware: PlatformContext.middleware(),
  path: RoutingUtil.path('/platform/v1/users/{id}/picture'),
  request: {
    params: validation().object({
      id: validation().literal('me'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: userResponse,
        },
      },
      description: 'The updated authenticated user.',
    },
    401: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The request is not authenticated.',
    },
    404: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The authenticated user was not found.',
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
  tags: ['Users'],
}), async c => {
  const user = PlatformContext.getUser();

  const result = await removePictureUsersApplication({
    id: user.id,
  });

  return c.json(result, 200);
});

export { handler as removePictureUsersPlatformHandler };
