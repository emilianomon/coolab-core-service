import { env } from '@self/consts';
import winston from 'winston';

type Metadata = Record<string, unknown>;

class LoggingUtil {
  private static readonly logger = winston.createLogger({
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

  public static debug(message: string, metadata?: Metadata) {
    LoggingUtil.logger.debug(message, metadata);
  }

  public static error(message: string, metadata?: Metadata) {
    LoggingUtil.logger.error(message, metadata);
  }

  public static info(message: string, metadata?: Metadata) {
    LoggingUtil.logger.info(message, metadata);
  }

  public static warn(message: string, metadata?: Metadata) {
    LoggingUtil.logger.warn(message, metadata);
  }
}

export { LoggingUtil };
