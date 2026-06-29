import { app } from '@self/app';
import { updatePictureUsersApplication } from '@self/application';
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
  description: 'Updates the authenticated platform user picture.',
  method: 'patch',
  middleware: PlatformContext.middleware(),
  path: RoutingUtil.path('/platform/v1/users/{id}/picture'),
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: validation().object({
            picture: validation().picture(),
          }).strict(),
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
          schema: userResponse,
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
  const body = await c.req.valid('form');

  const result = await updatePictureUsersApplication({
    id: user.id,
    picture: body.picture,
  });

  return c.json(result, 200);
});

export { handler as updatePictureUsersPlatformHandler };
