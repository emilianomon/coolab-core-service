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
const accessTokenTtlMs = 1000 * 60 * 60 * 24 * 30;

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
