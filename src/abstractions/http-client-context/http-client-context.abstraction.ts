import { Context } from '@self/abstractions/context';
import { Context as HonoContext, MiddlewareHandler } from 'hono';

type BaseProperties = {
  request: {
    body: Record<string, unknown>;
    headers: Record<string, string>;
    ip?: string;
    method: string;
    path: string;
    rawBody?: string;
  };
};

export abstract class HttpClientContext<TProperties extends object> extends Context<TProperties & BaseProperties> {
  public abstract middleware(): MiddlewareHandler;

  protected async setupBaseProperties(c: HonoContext): Promise<BaseProperties> {
    let body: Record<string, unknown> = {};
    let rawBody: string | undefined = undefined;

    try {
      const parsedBody = await c.req.json();
      if(parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
        body = parsedBody;
      }
    } catch {
      rawBody = await c.req.text().catch(() => undefined);
    }

    const headers = c.req.header();
    const ip = headers['cf-connecting-ip']
      || headers['x-forwarded-for']?.split(',')[0]?.trim()
      || headers['fly-client-ip']
      || headers['true-client-ip']
      || headers['x-real-ip'];

    return {
      request: {
        body,
        headers,
        ip,
        method: c.req.method,
        path: c.req.path,
        rawBody,
      },
    };
  }
}
