import '@self/handlers';

import { serve } from '@hono/node-server';
import { app } from '@self/app';
import { env } from '@self/consts';
import { DataUtil, LoggingUtil } from '@self/utils';

const handlerTimeoutMs = 30 * 60 * 1000;

serve({
  fetch: app.fetch,
  port: Number(env.HTTP_PORT),
  serverOptions: {
    headersTimeout: handlerTimeoutMs,
    requestTimeout: handlerTimeoutMs,
  },
}, info => {
  LoggingUtil.info(`Server is running on http://localhost:${info.port}`);
});

process.on('uncaughtException', error => {
  LoggingUtil.error(`Uncaught exception: ${DataUtil.stringifyError(error)}`);
  process.exit(1);
});

process.on('unhandledRejection', error => {
  LoggingUtil.error(`Unhandled rejection: ${DataUtil.stringifyError(error)}`);
});
