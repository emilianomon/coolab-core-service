import { HttpClientContext } from '@self/abstractions';
import { env, platformWorkspacePermissions } from '@self/consts';
import { PlatformEncryption } from '@self/encryptions';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { UsersRepository, WorkspacesRepository } from '@self/repositories';
import { UsersService, WorkspacesService } from '@self/services';
import { validation } from '@self/validation';
import { MiddlewareHandler } from 'hono';

import { LoggingContext } from '../logging';

type User = {
  createdAt: Date;
  email: string;
  emailStatus: 'pending' | 'verified';
  id: string;
  lastAuthenticationAt: Date | null;
  name: string | null;
  picture: string | null;
  updatedAt: Date;
};

type Workspace = {
  createdAt: Date;
  id: string;
  name: string;
  permissions: (typeof platformWorkspacePermissions)[keyof typeof platformWorkspacePermissions];
  picture: string | null;
  role: keyof typeof platformWorkspacePermissions;
  updatedAt: Date;
};

type Properties = {
  user: User;
  workspace: Workspace | null;
};

const ttlSeconds = env.NODE_ENV === 'local' ? 1 : 3600;
const accessTokenTtlMs = 1000 * 60 * 60 * 24 * 30;

class PlatformContext extends HttpClientContext<Properties> {
  public getUser() {
    const { properties: { user } } = this.get();
    return user;
  }

  public getWorkspace() {
    const { properties: { workspace } } = this.get();

    if(!workspace) {
      throw new ForbiddenException({
        feedback: {
          enUs: 'You do not have permission to access this workspace.',
          esEs: 'No tienes permiso para acceder a este workspace.',
          ptBr: 'Você não tem permissão para acessar este espaço de trabalho.',
        },
        message: 'Forbidden workspace.',
      });
    }

    return workspace;
  }

  public middleware(): MiddlewareHandler {
    return async (c, next) => {
      const authorization = c.req.header('authorization');

      if(!authorization) {
        throw new UnauthorizedException({
          feedback: {
            enUs: 'Authentication is required.',
            esEs: 'La autenticación es obligatoria.',
            ptBr: 'Autenticação é necessária.',
          },
          message: 'Unauthorized.',
        });
      }

      let decrypted: ReturnType<typeof PlatformEncryption.decryptAccessToken>;

      try {
        decrypted = PlatformEncryption.decryptAccessToken(authorization);
      } catch {
        throw new UnauthorizedException({
          feedback: {
            enUs: 'The authentication token is invalid.',
            esEs: 'El token de autenticación no es válido.',
            ptBr: 'O token de autenticação é inválido.',
          },
          message: 'Invalid token.',
        });
      }

      if(decrypted.createdAt < new Date(Date.now() - accessTokenTtlMs)) {
        throw new UnauthorizedException({
          feedback: {
            enUs: 'The authentication token has expired.',
            esEs: 'El token de autenticación ha expirado.',
            ptBr: 'O token de autenticação expirou.',
          },
          message: 'The token has expired.',
        });
      }

      const user = await MemoizationMemory.memo({
        callback: async () => {
          return UsersRepository.selectById(decrypted.content.id)
            .selectAll()
            .executeTakeFirst();
        },
        key: `memo:user-in-platform-context:${decrypted.content.id}`,
        ttlSeconds,
      });

      if(!user) {
        throw new NotFoundException({
          feedback: {
            enUs: 'The requested user could not be found.',
            esEs: 'No se pudo encontrar el usuario solicitado.',
            ptBr: 'O usuário solicitado não foi encontrado.',
          },
          message: 'The user was not found.',
        });
      }

      if(user.email !== decrypted.content.email) {
        throw new UnauthorizedException({
          feedback: {
            enUs: 'The authentication token is invalid.',
            esEs: 'El token de autenticación no es válido.',
            ptBr: 'O token de autenticação é inválido.',
          },
          message: 'Invalid token.',
        });
      }

      const lastAuthenticationAt = new Date();

      await UsersRepository.touchLastAuthenticationAt({
        id: user.id,
        lastAuthenticationAt,
      })
        .executeTakeFirst();

      const baseProperties = await this.setupBaseProperties(c);

      LoggingContext.log({
        level: 'info',
        message: 'Platform context initialized.',
        meta: {
          tokenCreatedAt: decrypted.createdAt.toISOString(),
          userId: user.id,
        },
      });

      const mappedUser = await UsersService.ensurePictureUrl(user);
      const userId = decrypted.content.id;
      const workspaceId = c.req.header('x-workspace-id') || 'null';
      let mappedWorkspace: Workspace | null = null;

      if(workspaceId !== 'null') {
        const check = validation().id().safeParse(workspaceId);

        if(!check.success) {
          throw new BadRequestException({
            feedback: {
              enUs: `The workspace ID "${workspaceId}" is invalid. Please provide a valid workspace ID.`,
              esEs: `El ID de workspace "${workspaceId}" no es válido. Por favor, proporciona un ID de workspace válido.`,
              ptBr: `O ID do espaço de trabalho "${workspaceId}" é inválido. Por favor, forneça um ID de espaço de trabalho.`,
            },
            message: `Invalid workspace ID: ${workspaceId}`,
          });
        }

        const workspace = await MemoizationMemory.memo({
          callback: async () => {
            return WorkspacesRepository.select()
              .innerJoin('workspaceUsers', 'workspaces.id', 'workspaceUsers.workspaceId')
              .where('workspaceUsers.userId', '=', userId)
              .where('workspaceUsers.workspaceId', '=', workspaceId)
              .selectAll('workspaces')
              .select('workspaceUsers.role as role')
              .executeTakeFirst();
          },
          key: `memo:user-workspace-in-platform-context:${userId}:${workspaceId}`,
          ttlSeconds,
        });

        if(!workspace) {
          throw new ForbiddenException({
            feedback: {
              enUs: 'You do not have permission to access this workspace.',
              esEs: 'No tienes permiso para acceder a este workspace.',
              ptBr: 'Você não tem permissão para acessar este espaço de trabalho.',
            },
            message: 'Forbidden workspace.',
          });
        }

        mappedWorkspace = await WorkspacesService.ensurePictureUrl({
          createdAt: workspace.createdAt,
          id: workspace.id,
          name: workspace.name,
          permissions: platformWorkspacePermissions[workspace.role],
          picture: workspace.picture,
          role: workspace.role,
          updatedAt: workspace.updatedAt,
        });
      }

      return this.init({
        properties: {
          ...baseProperties,
          user: mappedUser,
          workspace: mappedWorkspace,
        },
        traceId: LoggingContext.get().traceId,
      }, next);
    };
  }
}

const context = new PlatformContext();

export { context as PlatformContext };
