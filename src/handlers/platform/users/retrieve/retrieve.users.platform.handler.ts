import { app } from '@self/app';
import { retrieveUsersApplication } from '@self/application';
import { PlatformContext } from '@self/contexts';
import { routing } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(routing().route({
  description: 'Retrieves the authenticated platform user.',
  method: 'get',
  middleware: PlatformContext.middleware(),
  path: routing().path('/platform/v1/users/{id}'),
  request: {
    params: validation().object({
      id: validation().literal('me'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: validation().tables().users().selectable().pick({
            createdAt: true,
            email: true,
            emailStatus: true,
            id: true,
            lastAuthenticationAt: true,
            name: true,
            picture: true,
            updatedAt: true,
          }),
        },
      },
      description: 'The authenticated user.',
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
  const result = await retrieveUsersApplication({
    id: user.id,
  });

  return c.json(result, 200);
});

export { handler as retrieveUsersPlatformHandler };
