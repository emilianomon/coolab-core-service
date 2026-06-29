import { app } from '@self/app';
import { authenticateUsersApplication } from '@self/application';
import { RoutingUtil } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(RoutingUtil.route({
  description: 'Authenticates a user from an authentication token.',
  method: 'post',
  path: RoutingUtil.path('/platform/v1/users/authenticate'),
  request: {
    body: {
      content: {
        'application/json': {
          schema: validation().object({
            token: validation().string().openapi({
              description: 'The authentication token used to generate an access token.',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: validation().object({
            accessToken: validation().string(),
          }),
        },
      },
      description: 'The user was authenticated and an access token was generated.',
    },
    401: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The authentication token is invalid or expired.',
    },
    404: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The user was not found.',
    },
  },
  tags: ['Users'],
}), async c => {

  const { token } = c.req.valid('json');

  const result = await authenticateUsersApplication({
    token,
  });

  return c.json(result, 200);
});

export { handler as authenticateUsersPlatformHandler };
