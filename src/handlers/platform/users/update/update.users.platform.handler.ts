import { app } from '@self/app';
import { updateUsersApplication } from '@self/application';
import { PlatformContext } from '@self/contexts';
import { routing } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(routing().route({
  description: 'Updates the authenticated platform user.',
  method: 'patch',
  middleware: PlatformContext.middleware(),
  path: routing().path('/platform/v1/users/{id}'),
  request: {
    body: {
      content: {
        'application/json': {
          schema: validation().helpers().ensureField(
            validation().tables().users().updatable(),
          ),
        },
      },
    },
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
      description: 'The updated authenticated user.',
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
  const body = c.req.valid('json');

  const result = await updateUsersApplication({
    id: user.id,
    ...body,
  });

  return c.json(result, 200);
});

export { handler as updateUsersPlatformHandler };
