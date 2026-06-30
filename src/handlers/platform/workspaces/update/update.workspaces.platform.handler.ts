import { app } from '@self/app';
import { updateWorkspacesApplication } from '@self/application';
import { PlatformContext } from '@self/contexts';
import { BadRequestException, ForbiddenException } from '@self/exceptions';
import { RoutingUtil } from '@self/utils';
import { validation } from '@self/validation';

const handler = app.openapi(RoutingUtil.route({
  description: 'Updates the active workspace.',
  method: 'patch',
  middleware: PlatformContext.middleware(),
  path: RoutingUtil.path('/platform/v1/workspaces/{id}'),
  request: {
    body: {
      content: {
        'application/json': {
          schema: validation().helpers().ensureField(
            validation().tables().workspaces().updatable().omit({
              picture: true,
            }).extend({
              picture: validation().picture().nullable().optional(),
            }),
          ),
        },
      },
    },
    params: validation().object({
      id: validation().id(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: validation().tables().workspaces().selectable(),
        },
      },
      description: 'The workspace was updated.',
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
    403: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The user is not authorized to update the workspace.',
    },
    404: {
      content: {
        'application/json': {
          schema: validation().exception(),
        },
      },
      description: 'The workspace was not found.',
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
  const workspace = PlatformContext.getWorkspace();
  const params = c.req.valid('param');
  const body = c.req.valid('json');

  if(params.id !== workspace.id) {
    throw new BadRequestException({
      feedback: {
        enUs: 'The workspace ID must match the active workspace.',
        esEs: 'El ID del workspace debe coincidir con el workspace activo.',
        ptBr: 'O ID do workspace deve corresponder ao workspace ativo.',
      },
      message: 'The workspace ID must match the active workspace.',
    });
  }

  if(!workspace.permissions.workspaceManagement) {
    throw new ForbiddenException({
      feedback: {
        enUs: 'You do not have permission to update this workspace.',
        esEs: 'No tienes permiso para actualizar este workspace.',
        ptBr: 'Você não tem permissão para atualizar este workspace.',
      },
      message: 'The user is not authorized to update the workspace.',
    });
  }

  const result = await updateWorkspacesApplication({
    id: workspace.id,
    name: body.name,
    picture: body.picture,
    userId: user.id,
  });

  return c.json(result, 200);
});

export { handler as updateWorkspacesPlatformHandler };
