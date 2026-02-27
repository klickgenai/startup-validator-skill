// =============================================================================
// Structured Logger — pino with PII redaction (guardrail 9)
// =============================================================================

import pino from 'pino';
import type { Env } from '../config/env';

export function createLogger(env: Env): pino.Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'password', 'passwordHash', 'token', '*.password', '*.passwordHash'],
      censor: '[REDACTED]',
    },
    ...(env.NODE_ENV === 'production'
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }),
    serializers: {
      err: pino.stdSerializers.err,
      req: (req) => ({
        method: req.method,
        url: req.url,
        correlationId: req.correlationId,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  });
}
