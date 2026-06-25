import { HttpClientContext } from '@self/abstractions';
import { env } from '@self/consts';
import { PlatformEncryption } from '@self/encryptions';
import { NotFoundException, UnauthorizedException } from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { UsersRepository } from '@self/repositories';
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

type Properties = {
  user: User;
};

const ttlSeconds = env.NODE_ENV === 'local' ? 1 : 3600;

class PlatformContext extends HttpClientContext<Properties> {
  public getUser() {
    const { properties: { user } } = this.get();
    return user;
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

      if(!authorization.startsWith('Bearer ')) {
        throw new UnauthorizedException({
          feedback: {
            enUs: 'The authentication header is invalid.',
            esEs: 'El encabezado de autenticación no es válido.',
            ptBr: 'O cabeçalho de autenticação é inválido.',
          },
          message: 'Invalid authorization header.',
        });
      }

      const token = authorization.slice('Bearer '.length).trim();
      let decrypted: ReturnType<typeof PlatformEncryption.decryptAccessToken>;

      try {
        decrypted = PlatformEncryption.decryptAccessToken(token);
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

      return this.init({
        properties: {
          ...baseProperties,
          user: {
            createdAt: user.createdAt,
            email: user.email,
            emailStatus: user.emailStatus,
            id: user.id,
            lastAuthenticationAt,
            name: user.name,
            picture: user.picture,
            updatedAt: user.updatedAt,
          },
        },
        traceId: LoggingContext.get().traceId,
      }, next);
    };
  }
}

const context = new PlatformContext();

export { context as PlatformContext };
