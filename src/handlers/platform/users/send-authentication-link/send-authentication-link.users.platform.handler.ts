import { app } from '@self/app';
import { sendAuthenticationLinkUsersApplication } from '@self/application';
import { RoutingUtil } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(RoutingUtil.route({
  description: 'Sends an authentication link to a user.',
  method: 'post',
  path: RoutingUtil.path('/platform/v1/users/send-authentication-link'),
  request: {
    body: {
      content: {
        'application/json': {
          schema: validation().object({
            email: validation().email(),
          }),
        },
      },
    },
    headers: validation().object({
      'x-origin': validation().url(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: validation().union([
            validation().object({
              authenticationToken: validation().string(),
            }),
            validation().empty(),
          ]),
        },
      },
      description: 'The authentication link was sent to the user or a new user authentication token was generated.',
    },
    400: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The request is invalid.',
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

  const body = c.req.valid('json');
  const headers = c.req.valid('header');

  const result = await sendAuthenticationLinkUsersApplication({
    email: body.email,
    origin: headers['x-origin'],
  });

  if(result && 'authenticationToken' in result) {
    return c.json({
      authenticationToken: result.authenticationToken,
    }, 200);
  }

  return c.json({
    message: 'That worked!',
  }, 200);
});

export { handler as sendAuthenticationLinkUsersPlatformHandler };
