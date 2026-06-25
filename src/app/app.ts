import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Exception } from '@self/abstractions';
import { env, fileLimits } from '@self/consts';
import { LoggingContext } from '@self/contexts';
import { BadRequestException, PayloadTooLargeException } from '@self/exceptions';
import { validation } from '@self/validation';
import { bodyLimit } from 'hono/body-limit';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { HTTPException as HonoHTTPException } from 'hono/http-exception';
import { z } from 'zod';

type ExceptionWithTraceId = z.infer<ReturnType<ReturnType<typeof validation>['exception']>> & {
  detail?: ReturnType<typeof z.treeifyError>;
  traceId: string;
};

const handler = new OpenAPIHono({
  defaultHook: (result, c) => {
    if(result.success) return;

    const traceId = LoggingContext.get().traceId;
    const error = new BadRequestException({
      feedback: {
        enUs: 'The provided request data is invalid.',
        esEs: 'Los datos de la solicitud proporcionados no son válidos.',
        ptBr: 'Os dados da solicitação fornecidos são inválidos.',
      },
      message: z.prettifyError(result.error),
    });

    return c.json({
      ...error.toHandlerResponse(),
      detail: z.treeifyError(result.error),
      traceId,
    } satisfies ExceptionWithTraceId, error.status);
  },
});

handler.onError((error, c) => {
  const traceId = LoggingContext.get().traceId;

  if(error instanceof Exception) {
    return c.json({
      ...error.toHandlerResponse(),
      traceId,
    }, error.status);
  }

  if(error instanceof HonoHTTPException && error.status === 400) {
    return c.json({
      feedback: {
        enUs: 'The provided request data is invalid.',
        esEs: 'Los datos de la solicitud proporcionados no son válidos.',
        ptBr: 'Os dados da solicitação fornecidos são inválidos.',
      },
      message: error.message,
      name: 'BadRequestException',
      traceId,
    }, error.status);
  }

  return c.json({
    feedback: {
      enUs: 'An unexpected error occurred. Please try again later.',
      esEs: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.',
      ptBr: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
    },
    message: error.message,
    name: error.name,
    traceId,
  }, 500);
});

handler.use(contextStorage());
handler.use(LoggingContext.middleware());
handler.use('*', cors());
handler.use('*', bodyLimit({
  maxSize: fileLimits.maxRequestBodySize,
  onError: c => {
    const traceId = LoggingContext.get().traceId;
    const error = new PayloadTooLargeException({
      feedback: {
        enUs: 'The request payload is too large.',
        esEs: 'El cuerpo de la solicitud es demasiado grande.',
        ptBr: 'O corpo da requisição é muito grande.',
      },
      message: 'Request body exceeds maximum allowed size.',
    });

    return c.json({
      ...error.toHandlerResponse(),
      traceId,
    }, error.status);
  },
}));
handler.use(LoggingContext.logger());

handler.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  c.header('Expires', '0');
  c.header('Pragma', 'no-cache');
  c.header('Surrogate-Control', 'no-store');
});

handler.get('/', c => {
  return c.json({
    message: 'Coolab Core Service',
  }, 200);
});

handler.get('/health', c => {
  return c.json({
    message: 'I\'m alive!',
  }, 200);
});

if(env.NODE_ENV !== 'production') {
  handler.get('/openapi/platform', c => {
    const doc = handler.getOpenAPIDocument({
      info: {
        title: 'Platform API',
        version: '1.0.0',
      },
      openapi: '3.1.0',
    });

    doc.paths = Object.fromEntries(
      Object.entries(doc.paths ?? {}).filter(([routePath]) => routePath.startsWith('/platform')),
    );

    return c.json(doc);
  });

  handler.get('/swagger/platform', swaggerUI({
    url: '/openapi/platform',
  }));
}

const app = handler;

export { app };
