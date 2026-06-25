import { env } from '@self/consts';
import winston from 'winston';

type Metadata = Record<string, unknown>;

const logger = winston.createLogger({
  defaultMeta: {
    env: env.NODE_ENV,
    service: env.SERVICE_NAME,
  },
  handleExceptions: true,
  level: 'silly',
  transports: [
    new winston.transports.Console({
      format: winston.format.json(),
    }),
  ],
});

const debug = (message: string, metadata?: Metadata) => {
  logger.debug(message, metadata);
};

const error = (message: string, metadata?: Metadata) => {
  logger.error(message, metadata);
};

const info = (message: string, metadata?: Metadata) => {
  logger.info(message, metadata);
};

const warn = (message: string, metadata?: Metadata) => {
  logger.warn(message, metadata);
};

export const logging = () => ({
  debug,
  error,
  info,
  warn,
});
