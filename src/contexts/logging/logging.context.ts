import { Context } from '@self/abstractions/context';
import { DataUtil } from '@self/utils';
import { MiddlewareHandler } from 'hono';

type Properties = object;

class LoggingContext extends Context<Properties> {
  public async run<T>(params: { traceId?: string; }, callback: () => Promise<T>) {
    return this.init({
      properties: {},
      traceId: params.traceId,
    }, callback);
  }

  public middleware(): MiddlewareHandler {
    return async (c, next) => {
      const traceId = c.req.header('x-trace-id');

      await this.init({
        properties: {},
        traceId,
      }, next);
    };
  }

  public logger(): MiddlewareHandler {
    return async (c, next) => {
      const start = Date.now();
      await next();
      const elapsed = Date.now() - start;

      let body: Record<string, unknown> = {};
      let rawBody: string | undefined = undefined;

      try {
        const parsedBody = await c.req.json();
        if(parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
          body = parsedBody;
        }
      } catch {
        rawBody = await c.req.text().catch(() => '');
      }

      const headers = this.redactHeaders(c.req.header());
      const redactedBody = this.redactObject(body);
      const redactedQuery = this.redactObject(c.req.query());
      const ip = headers['cf-connecting-ip']
        || headers['x-forwarded-for']?.split(',')[0]?.trim()
        || headers['fly-client-ip']
        || headers['true-client-ip']
        || headers['x-real-ip'];

      this.log({
        level: c.res.status > 299 ? 'error' : 'info',
        message: `[${c.req.method.toUpperCase()}] [${c.res.status}] ${c.req.path} [${elapsed}ms]`,
        meta: {
          ...(c.error ? {
            error: DataUtil.stringifyError(c.error),
          } : {}),
          body: redactedBody,
          headers,
          ip,
          query: redactedQuery,
          rawBody: rawBody ? '[REDACTED]' : undefined,
          status: c.res.status,
        },
      });
    };
  }

  private redactHeaders(headers: Record<string, string>) {
    const redacted = {
      ...headers,
    };

    for(const key of Object.keys(redacted)) {
      const lower = key.toLowerCase();
      if(lower === 'authorization' || lower.includes('token')) {
        redacted[key] = 'REDACTED';
      }
    }

    return redacted;
  }

  private redactObject<T extends Record<string, unknown>>(object: T): T {
    const redacted = {
      ...object,
    };

    for(const key of Object.keys(redacted)) {
      const lower = key.toLowerCase();
      if(lower === 'authorization' || lower.includes('token')) {
        redacted[key as keyof T] = 'REDACTED' as T[keyof T];
      }
    }

    return redacted;
  }
}

const context = new LoggingContext();

export { context as LoggingContext };
