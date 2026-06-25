import '@self/handlers';

import { serve } from '@hono/node-server';
import { app } from '@self/app';
import { env } from '@self/consts';
import { data, logging } from '@self/utils';

const handlerTimeoutMs = 30 * 60 * 1000;

serve({
  fetch: app.fetch,
  port: Number(env.HTTP_PORT),
  serverOptions: {
    headersTimeout: handlerTimeoutMs,
    requestTimeout: handlerTimeoutMs,
  },
}, info => {
  logging().info(`Server is running on http://localhost:${info.port}`);
});

process.on('uncaughtException', error => {
  logging().error(`Uncaught exception: ${data().stringifyError(error)}`);
  process.exit(1);
});

process.on('unhandledRejection', error => {
  logging().error(`Unhandled rejection: ${data().stringifyError(error)}`);
});
